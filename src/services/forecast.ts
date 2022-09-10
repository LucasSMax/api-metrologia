import { StormGlass, ForecastPoint } from '@src/clients/stormGlass';

export enum BeachPosition {
    S = 'S',
    E = 'E',
    W = 'W',
    N = 'N'
}

export interface Beach {
    name: string,
    position: BeachPosition,
    lat: number,
    lng: number,
    user: string
}

export interface TimeForecast {
    time: string,
    forecast: BeachForecast[]
}

export interface BeachForecast extends Omit<Beach, 'user'>, ForecastPoint{};


export class Forecast{
    constructor(protected stormGlas = new StormGlass()){};

    public async processForecastForBeaches(beaches: Beach[]): Promise<TimeForecast[]> {
        const pointWithCorrectSources: BeachForecast[] = [];
        for(const beach of beaches) {
            const points = await this.stormGlas.fetchPoints(beach.lat, beach.lng);
            const enrichedBeachData = points.map((e) =>({
                ... {
                    lat: beach.lat,
                    lng: beach.lng,
                    name: beach.name,
                    position: beach.position,
                    rating: 1
                },
                ...e                
            }));
            pointWithCorrectSources.push(...enrichedBeachData);
        }
        return this.mapForecastByTime(pointWithCorrectSources);
    }

    private mapForecastByTime(forecast: BeachForecast[]): TimeForecast[] {
        const forecastByTime: TimeForecast[] = [];
        for (const point of forecast) {
            const timePoint = forecastByTime.find((f) => f.time === point.time)
            if(timePoint) {
                timePoint.forecast.push(point);
            } else {
                forecastByTime.push({
                    time: point.time,
                    forecast: [point]
                })
            }
        }
        return forecastByTime;
    }
}