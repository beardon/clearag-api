'use strict';

const axios = require('axios').default;

class ClearAg {

    constructor(options) {
        this.appId = options.appId || options.app_id || '';
        this.appKey = options.appKey || options.app_key || '';
        this.debug = options.debug || false;
        this.host = options.host || 'https://ag.us.clearapis.com';
    }

    _buildApiUrl = (endpoint) => {
        if (endpoint.substring(0, 1) !== '/') {
            endpoint = '/' + endpoint;
        }
        return this.host + endpoint;
    };

    /**
     * HTTP request to ClearAg API.  Automatically adds App ID and Key.
     * @param {Object} config   Axios library config
     * @returns {Promise}
     * @private
     */
    _http = (config) => {
        config = config || {};
        config.params.app_id = (this.appId ? this.appId : (config.appId ? config.appId : null));
        config.params.app_key = (this.appKey ? this.appKey : (config.appKey ? config.appKey : null));
        return axios.request(config)
            .then((response) => {
                if (!this._isResponseSuccessful(response)) {
                    const err = new Error(`${ response.status } - ${ config.url } failed`);
                    err.code = response.status;
                    err.meta = response.data;
                    throw err;
                }
                return response.data;
            })
    };

    /**
     * Makes a GET request to the ClearAg API.
     * @param {string} endpoint       API endpoint
     * @param {Object} [params]       the URL parameters to be sent with the request
     * @param {string} [appId]        ClearAg App ID
     * @param {string} [appKey]       ClearAg App Key
     * @returns {Promise}
     * @private
     */
    _httpGet = (endpoint, params, appId, appKey) => {
        const config = {
            method: 'get',
            url: this._buildApiUrl(endpoint),
            params: params || {},
            appId: appId,
            appKey: appKey,
        };
        return this._http(config);
    };

    _isResponseSuccessful = (response) => {
        return ((response.status >= 200) && (response.status < 300));
    };

    /**
     * Daily Historical Air Temperature
     * The Daily Historical Air Temperature service provides historical air temperature data for a specified location. The data provided by this endpoint is valid from midnight to 11:59 p.m. in the time zone of the location queried, with a maximum of 366 days of data returned per query. Historical data availability ranges from January 1, 1980 through the previous complete day.
     * @param {number} start       Start time of the data being returned in the form of a Unix timestamp.
     * @param {number} end         End time of the data being returned in the form of a Unix timestamp.
     * @param {number} latitude    User-provided latitude coordinate in decimal degrees.
     * @param {number} longitude   User-provided longitude coordinate in decimal degrees.
     * @param {string} [location]  User-provided latitude and longitude coordinates in decimal degrees. Users are allowed a maximum of five coordinates, formatted as "&location=[(<lat_1>,<lon_1>),(<lat_2>,<lon_2>)]."
     * @param {string} [unitcode]  Unit conversion set to be used. Default is "us-std." Valid values are "us-std," "si-std," "us-std-precise," and "si-std-precise." When "precise" is not set, the output will be rounded to an appropriate level of precision for the parameter.
     * @returns {Promise}
     */
    dailyHistoricalAirTemperature = async (start, end, latitude, longitude, location, unitcode) => {
        const endpoint = '/v1.2/historical/daily/air_temp';
        const config = {
            start,
            end,
            location: location ? location : `${ latitude }, ${ longitude }`,
            unitcode,
        };
        return this._httpGet(endpoint, config);
    };

}

module.exports = ClearAg;
