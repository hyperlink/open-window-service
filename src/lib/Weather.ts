import got from 'got';

const ENDPOINT_URL = 'https://api.openweathermap.org/data/2.5/weather';

export interface CurrentWeather {
  coord:      Coord;
  weather:    Weather[];
  base:       string;
  main:       Main;
  visibility: number;
  wind:       Wind;
  rain:       Rain;
  clouds:     Clouds;
  dt:         number;
  sys:        Sys;
  timezone:   number;
  id:         number;
  name:       string;
  cod:        number;
}

export interface Clouds {
  all: number;
}

export interface Coord {
  lon: number;
  lat: number;
}

export interface Main {
  temp:       number;
  feels_like: number;
  temp_min:   number;
  temp_max:   number;
  pressure:   number;
  humidity:   number;
}

export interface Rain {
  '1h': number;
}

export interface Sys {
  type:    number;
  id:      number;
  country: string;
  sunrise: number;
  sunset:  number;
}

export interface Weather {
  id:          number;
  main:        string;
  description: string;
  icon:        string;
}

export interface Wind {
  speed: number;
  deg:   number;
  gust:  number;
}


export default class WeatherRepository {
    constructor (private appid: string) {

    }

    async getWeather(zip: string): Promise<CurrentWeather> {
        const result = await got.get(ENDPOINT_URL, {
            searchParams: {
                zip,
                units: 'imperial',
                appid: this.appid
            }
        }).json<CurrentWeather>();
        return result;
    }
}