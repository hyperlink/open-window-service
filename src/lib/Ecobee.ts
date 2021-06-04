import got from 'got';
import * as _ from 'lodash';

const THERMO_ENDPOINT_URL = 'https://api.ecobee.com/1/thermostat';
const TOKEN_URL = 'https://api.ecobee.com/token';

export interface ThermostatResult {
  page:           Page;
  thermostatList: ThermostatList[];
  status:         Status;
}

export interface Page {
  page:       number;
  totalPages: number;
  pageSize:   number;
  total:      number;
}

export interface Status {
  code:    number;
  message: string;
}

export interface ThermostatList {
  identifier:     string;
  name:           string;
  thermostatRev:  string;
  isRegistered:   boolean;
  modelNumber:    string;
  brand:          string;
  features:       string;
  lastModified:   string;
  thermostatTime: string;
  utcTime:        string;
  remoteSensors:  RemoteSensor[];
}

export interface RemoteSensor {
  id:         string;
  name:       string;
  type:       string;
  inUse:      boolean;
  capability: Capability[];
  code?:      string;
}

export interface Capability {
  id:    string;
  type:  Type;
  value: string;
}

export enum Type {
  Humidity = 'humidity',
  Occupancy = 'occupancy',
  Temperature = 'temperature',
}

export interface TokenResult {
  access_token:  string;
  token_type:    string;
  refresh_token: string;
  expires_in:    number;
  scope:         string;
}


export default class Ecobee {
  private accessToken = '';
  constructor(private refreshToken: string, private clientId: string) {

  }

  private async refreshAccessToken(): Promise<void> {
      const tokenResult = await got.post(TOKEN_URL, {
          searchParams: {
              grant_type: 'refresh_token',
              code: this.refreshToken,
              client_id: this.clientId
          }
      }).json<TokenResult>();
      this.accessToken = tokenResult.access_token;
      this.refreshToken = tokenResult.refresh_token;
  }

  async getTemperatureForSensor(name: string): Promise<number> {
      await this.refreshAccessToken();
      const body = JSON.stringify({
          selection: {
              selectionType: 'registered',
              selectionMatch: '',
              includeSensors: true
          }
      });
      const result = await got.get(THERMO_ENDPOINT_URL, {
          headers: {
              Authorization: `Bearer ${this.accessToken}`
          },
          searchParams: {
              format: 'json',
              body
          }
      }).json<ThermostatResult>();

      for (const thermostat of result.thermostatList) {
          for (const sensor of thermostat.remoteSensors) {
              if (sensor.name.toLocaleLowerCase() === name.toLocaleLowerCase()) {
                  const result = _.find<Capability>(sensor.capability, { type: Type.Temperature });
                  if (result == null) {
                      throw new Error(`Unable to find ${Type.Temperature}`);
                  }
                  return parseInt(result.value, 10)/10;
              }
          }
      }
      throw new Error('unable to find temperature for ' + name);
  }
}