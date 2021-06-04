import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import Ecobee from './lib/Ecobee';
import Weather from './lib/Weather';
import assert from 'assert';

const server: FastifyInstance = Fastify({ logger: true });

const weatherAppId = process.env.WEATHER_APP_ID;
assert(weatherAppId, 'weather API is required');
const weatherApi = new Weather(weatherAppId);

const ecobeeRefreshToken = process.env.ECOBEE_REFRESH_TOKEN;
assert(ecobeeRefreshToken, 'ECOBEE_REFRESH_TOKEN is required');

const ecobeeClientId = process.env.ECOBEE_CLIENT_ID;
assert(ecobeeClientId, 'ECOBEE_CLIENT_ID is required');

const ecobee = new Ecobee(ecobeeRefreshToken, ecobeeClientId);

const HUMIDITY_THRESHOLD = 80;

interface IParams {
  zipCode: string,
  sensorName: string
}

const opts: RouteShorthandOptions = {
  schema: {
    params: {
      type: 'object',
      properties: {
          zipCode: { type: 'string' },
          sensorName: { type: 'string' }
      }
    }
  }
};

server.get<{ Params: IParams }>('/:zipCode/:sensorName', opts, async (request) => {
  const { zipCode, sensorName } = request.params;
  const [ weatherResult, insideTemp ] = await Promise.all([
    weatherApi.getWeather(zipCode),
    ecobee.getTemperatureForSensor(sensorName)
  ]);
  const outsideTemp = weatherResult.main.temp;
  const humidity = weatherResult.main.humidity;

  let message = '';

  if (insideTemp > outsideTemp) {
    const difference = Math.round(insideTemp - outsideTemp);
    if (difference <= 2) {
        message = 'Maybe,';
    } else {
        message = 'Yes,';
    }
    message += ` it's ${difference}° cooler outside`;
    if (humidity > HUMIDITY_THRESHOLD) {
        message += ` but the humidity is ${humidity}%`;
    }
  } else {
    const difference = Math.round(outsideTemp - insideTemp);
    message = `No, it's ${difference}° warmer than inside.`;
  }
  server.log.info(message);
  return { temp: weatherResult.main.temp, feel_like: outsideTemp, humidity, insideTemp, message };
});

async function start () {
  try {
    await server.listen(process.env.PORT || 3000, '0.0.0.0');

    const address = server.server.address();
    const port = typeof address === 'string' ? address : address?.port;
    server.log.info(port);

  } catch (error) {
      server.log.error(error);
      process.exit(1);
  }
}

start();
