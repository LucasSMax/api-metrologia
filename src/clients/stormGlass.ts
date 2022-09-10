import { InternalError } from '@src/util/errors/internal-errors';
import config, { IConfig } from 'config';
import * as HTTPUtil from '@src/util/request';
import { AxiosError } from 'axios';
import { request } from 'http';

export interface StormGlassPointSource {
  readonly [key: string]: number;
}

export interface StormGlassPoint {
  readonly time: string;
  readonly waveHeight: StormGlassPointSource;
  readonly waveDirection: StormGlassPointSource;
  readonly swellDirection: StormGlassPointSource;
  readonly swellHeight: StormGlassPointSource;
  readonly swellPeriod: StormGlassPointSource;
  readonly windDirection: StormGlassPointSource;
  readonly windSpeed: StormGlassPointSource;
}

export interface StormGlassForecastResponse {
  hours: StormGlassPoint[];
}

export interface ForecastPoint {
  time: string;
  waveHeight: number;
  waveDirection: number;
  swellDirection: number;
  swellHeight: number;
  swellPeriod: number;
  windDirection: number;
  windSpeed: number;
}

export class StormGlassResponseError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error returned by the StormGlass service';
    super(`${internalMessage}: ${message}`);
  }
}

export class ClientRequestError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error when trying to communicate to StormGlass';
    super(`${internalMessage}: ${message}`);
  }
}

const stormglassResourceConfig: IConfig = config.get(
  'App.resources.StormGlass'
);

export class StormGlass {
  readonly stormGlassAPIParams =
    'swellDirection,swellHeight,swellPeriod,waveDirection,waveHeight,windDirection,windSpeed';
  readonly stormGlassAPISource = 'noaa';

  constructor(protected request = new HTTPUtil.Request()) {}

  public async fetchPoints(lat: number, lng: number): Promise<ForecastPoint[]> {
    try {
      const response = await this.request.get<StormGlassForecastResponse>(
        `${stormglassResourceConfig.get(
          'apiUrl'
        )}/weather/point?lat=${lat}&lng=${lng}&params=${
          this.stormGlassAPIParams
        }&source=${this.stormGlassAPISource}`,
        {
          headers: {
            Authorization: stormglassResourceConfig.get('apiToken'),
          },
        }
      );
      return this.normalizeResponse(response.data);
    } catch (err) {
      /**
       * This is handling the Axios errors specifically
       */
      if (err instanceof Error && HTTPUtil.Request.isRequestError(err)) {
        throw new StormGlassResponseError(
          `Error: ${JSON.stringify((err as AxiosError).response?.data)} Code: ${
            (err as AxiosError).response?.status
          }`
        );
      }
      // The type is temporary given we will rework it in the upcoming chapters
      throw new ClientRequestError((err as { message: any }).message);
    }
  }

  private normalizeResponse(
    points: StormGlassForecastResponse
  ): ForecastPoint[] {
    return points.hours.filter(this.isValidPont.bind(this)).map((point) => ({
      time: point.time,
      swellDirection: point.swellDirection[this.stormGlassAPISource],
      swellHeight: point.swellHeight[this.stormGlassAPISource],
      swellPeriod: point.swellPeriod[this.stormGlassAPISource],
      waveDirection: point.waveDirection[this.stormGlassAPISource],
      waveHeight: point.waveHeight[this.stormGlassAPISource],
      windDirection: point.windDirection[this.stormGlassAPISource],
      windSpeed: point.windSpeed[this.stormGlassAPISource],
    }));
  }

  private isValidPont(point: Partial<StormGlassPoint>): boolean {
    // !! força o resultado a ser um boolean
    return !!(
      point.time &&
      point.swellDirection?.[this.stormGlassAPISource] &&
      point.swellHeight?.[this.stormGlassAPISource] &&
      point.swellPeriod?.[this.stormGlassAPISource] &&
      point.waveDirection?.[this.stormGlassAPISource] &&
      point.waveHeight?.[this.stormGlassAPISource] &&
      point.windDirection?.[this.stormGlassAPISource] &&
      point.windSpeed?.[this.stormGlassAPISource]
    );
  }
}