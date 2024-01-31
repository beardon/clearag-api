const _ = require('lodash');
const axios = require('axios').default;

class ClearAgApi {

    constructor(options, logger) {
        this.name = 'clearag-api';
        this.appId = options.appId || options.app_id || '';
        this.appKey = options.appKey || options.app_key || '';
        this.host = options.host || 'https://ag.us.clearapis.com';
        this.logger = logger || null;
        this.loggerConfig = options.loggerConfig;
        this.logLevel = options.logLevel || 'verbose';
        this.responseType = options.responseType || 'json';
        this.timeout = options.timeout || (1000 * 60 * 3); // 30 minutes
    }

    _buildApiUrl(endpoint) {
        if (endpoint.substring(0, 1) !== '/') endpoint = '/' + endpoint;
        return this.host + endpoint;
    }

    /**
     * Daily Historical Air Temperature
     * The Daily Historical Air Temperature service provides historical air temperature data for a specified location. The data provided by this endpoint is valid from midnight to 11:59 p.m. in the time zone of the location queried, with a maximum of 366 days of data returned per query. Historical data availability ranges from January 1, 1980 through the previous complete day.
     * @param {Number} start       Start time of the data being returned in the form of a Unix timestamp.
     * @param {Number} end         End time of the data being returned in the form of a Unix timestamp.
     * @param {Number} latitude    User-provided latitude coordinate in decimal degrees.
     * @param {Number} longitude   User-provided longitude coordinate in decimal degrees.
     * @param {String} [location]  User-provided latitude and longitude coordinates in decimal degrees. Users are allowed a maximum of five coordinates, formatted as "&location=[(<lat_1>,<lon_1>),(<lat_2>,<lon_2>)]."
     * @param {String} [unitcode]  Unit conversion set to be used. Default is "us-std." Valid values are "us-std," "si-std," "us-std-precise," and "si-std-precise." When "precise" is not set, the output will be rounded to an appropriate level of precision for the parameter.
     * @returns {Promise}
     */
    async dailyHistoricalAirTemperature(start, end, latitude, longitude, location, unitcode) {
        const endpoint = '/v1.2/historical/daily/air_temp';
        const config = {
            start,
            end,
            location: location ? location : `${ latitude }, ${ longitude }`,
            unitcode,
        };
        return this._get(endpoint, config);
    }

    /**
     * HTTP request to ClearAg API.  Automatically adds App ID and Key.
     * @param {String} endpoint API endpoint
     * @param {Object} config   Axios library configuration
     * @returns {Promise}
     * @private
     */
    async _request(endpoint, config) {
        config = config || { };
        config.url = this._buildApiUrl(endpoint);
        config.responseType = this.responseType;
        config.params.app_id = (this.appId ? this.appId : (config.appId ? config.appId : null));
        config.params.app_key = (this.appKey ? this.appKey : (config.appKey ? config.appKey : null));
        if (this.timeout) config.timeout = this.timeout;
        const instance = axios.create();
        let response = null;
        try {
            response = await instance(config);
        } catch (e) {
            if (e.response) {
                this._writeLog(endpoint, config, e.response, 'error');
                if (e.response.status === 404) return null;
            }
            throw e;
        }
        this._writeLog(endpoint, config, response);
        return response.data;
    }

    /**
     * Makes a GET request to the ClearAg API.
     * @param {string} endpoint       API endpoint
     * @param {Object} [params]       the URL parameters to be sent with the request
     * @param {string} [appId]        ClearAg App ID
     * @param {string} [appKey]       ClearAg App Key
     * @returns {Promise}
     * @private
     */
    async _get(endpoint, params, appId, appKey) {
        const config = {
            method: 'GET',
            params: params || { },
            appId,
            appKey,
        };
        return this._request(endpoint, config);
    }

    _writeLog(endpoint, axiosConfig, response, logLevel = this.logLevel) {
        if (this.logger) {
            let logParts = [ `[${ this.name }]`, axiosConfig.method ];
            logParts.push(this.loggerConfig.url ? this._buildScheme() : null);
            logParts.push(this.loggerConfig.params ? response.request.path : endpoint);
            logParts.push(this.loggerConfig.data ? JSON.stringify(axiosConfig.data) : null);
            logParts.push(`${ response.status } ${ response.statusText }`);
            logParts.push(this.loggerConfig.response ? JSON.stringify(response.data) : null);
            const log = _.compact(logParts).join(' ');
            this.logger[ logLevel ](log);
        }
    }

}

module.exports = ClearAgApi;
