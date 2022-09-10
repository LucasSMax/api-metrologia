import forecastServiceExpectedResponse from '@test/fixtures/forecast_service_expected_response.json';
import stormGlassNormalizedWeather3HoursFixture from '@test/fixtures/stormglass_normalized_response_3_hours.json';
import { StormGlass } from '@src/clients/stormGlass';
import { Forecast, ForecastProcessingInternalError } from '@src/services/forecast';
import { Beach, BeachPosition } from '@src/models/beach';

jest.mock('@src/clients/stormGlass');

describe('Forecast Service', () => {
    const mockedStormGlassService = new StormGlass() as jest.Mocked<StormGlass>;

    it('should return the forecast for a list of beaches', async() =>{
        // prototype usado pq o fetchPoints precisa de uma instancia de StormGlass. Dessa forma o método foi substituido
        // StormGlass.prototype.fetchPoints = jest.fn().mockResolvedValue(stormGlassNormalizedWeather3HoursFixture);
        mockedStormGlassService.fetchPoints.mockResolvedValue(stormGlassNormalizedWeather3HoursFixture)

        const  beaches: Beach[] = [
            {
                lat: -33.792726,
                lng: 151.289824,
                name: 'Manly',
                position: BeachPosition.E
            }];

        const forecast = new Forecast(mockedStormGlassService);
        expect(await forecast.processForecastForBeaches(beaches)).toEqual(forecastServiceExpectedResponse);
        
    });

    it('should return an empty list when the beachs array is empty', async() => {
        const forecast = new Forecast();
        expect(await forecast.processForecastForBeaches([])).toEqual([]);
    });

    it('should throw internal processing error when something goes wrong during the rating process', async()=>{
        const  beaches: Beach[] = [
            {
                lat: -33.792726,
                lng: 151.289824,
                name: 'Manly',
                position: BeachPosition.E
            }];
        mockedStormGlassService.fetchPoints.mockRejectedValue('Error fetching data');
        const forecast = new Forecast(mockedStormGlassService);

        await expect(forecast.processForecastForBeaches(beaches)).rejects.toThrow(
            ForecastProcessingInternalError
        )

    });
})