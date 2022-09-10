import forecastServiceExpectedResponse from '@test/fixtures/forecast_service_expected_response.json';
import stormGlassNormalizedWeather3HoursFixture from '@test/fixtures/stormglass_normalized_response_3_hours.json';
import { StormGlass } from '@src/clients/stormGlass';
import { Beach, BeachPosition, Forecast } from '@src/services/forecast';


jest.mock('@src/clients/stormGlass');

describe('Forecast Service', () => {
    it('should return the forecast for a list of beaches', async() =>{
        // prototype usado pq o fetchPoints precisa de uma instancia de StormGlass. Dessa forma o método foi substituido
        StormGlass.prototype.fetchPoints = jest.fn().mockResolvedValue(stormGlassNormalizedWeather3HoursFixture);

        const  beaches: Beach[] = [
            {
                lat: -33.792726,
                lng: 151.289824,
                name: 'Manly',
                position: BeachPosition.E,
                user: 'some-id'
            }];

        const forecast = new Forecast(new StormGlass());
        expect(await forecast.processForecastForBeaches(beaches)).toEqual(forecastServiceExpectedResponse);
        
    });
})