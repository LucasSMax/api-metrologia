import { StormGlass } from '@src/clients/stormGlass';
import * as HTTPUtil from '@src/util/request';
import stormGlassWeather3HoursFixture from '@test/fixtures/stormglass_weather_3_hours.json';
import stormGlassNormalizedWeather3HoursFixture from '@test/fixtures/stormglass_normalized_response_3_hours.json';
import { AxiosError } from 'axios';

jest.mock('@src/util/request');

describe('StormGlass client', () => {
  const mockedRequestClass = HTTPUtil.Request as jest.Mocked<typeof HTTPUtil.Request>;
  const mockedRequest = new HTTPUtil.Request() as jest.Mocked<HTTPUtil.Request>;

  it('should return the normalized forecast from the StormFlass service', async () => {
    const lat = -33.784896;
    const lng = 151.4644;

    mockedRequest.get.mockResolvedValue({
      data: stormGlassWeather3HoursFixture,
    } as HTTPUtil.Response);

    const stormGlass = new StormGlass(mockedRequest);
    const response = await stormGlass.fetchPoints(lat, lng);
    expect(response).toEqual(stormGlassNormalizedWeather3HoursFixture);
  });

  it('should exclude incompleteded data points', async () => {
    const lat = -33.784896;
    const lng = 151.4644;
    const incompletedPoint = {
      hours: [
        {
          swellDirection: {
            noaa: 64.26,
          },
          swellHeight: {
            noaa: 0.15,
          },
        },
      ],
    };

    mockedRequest.get.mockResolvedValue({
      data: incompletedPoint,
    } as HTTPUtil.Response);
    const stormGlass = new StormGlass(mockedRequest);
    expect(await stormGlass.fetchPoints(lat, lng)).toEqual([]);
  });

  it('should get a generic error from StormGlass service when the request fail before reaching the service', async () => {
    const lat = -33.784896;
    const lng = 151.4644;

    mockedRequest.get.mockRejectedValue({ message: 'Network Error' });
    const stormGlass = new StormGlass(mockedRequest);
    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error when trying to communicate to StormGlass: Network Error'
    );
  });

  it('should get an StormGlassResponseError when the StormGlass service responds with error', async () => {
    const lat = -33.784896;
    const lng = 151.4644;

    class FakeAxiosError extends Error {
      constructor(public response: object) {
        super();
      }
    }

    mockedRequest.get.mockRejectedValue(
      new FakeAxiosError({
        status: 429,
        data: { errors: ['Rate limit reached'] },
      })
    );

    mockedRequestClass.isRequestError.mockReturnValue(true);

    const stormGlass = new StormGlass(mockedRequest);
    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error returned by the StormGlass service: Error: {"errors":["Rate limit reached"]} Code: 429'
    );
  });
});
