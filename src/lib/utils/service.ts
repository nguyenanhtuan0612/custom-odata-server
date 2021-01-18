var request = require('sync-request');
export class ServiceHelper {

  async calAPI(url: any, method: string, jsonData: any, token: string = null): Promise<any> {

    var res = request(method, url, {
      headers: {
        "Authorization": token,
        "Token": token
      },
      json: jsonData

    });
    console.log(res.getBody());
    return JSON.parse(res.getBody('utf8'));
  }

  async calAPISMS(jsonData: any): Promise<any> {
    var res = request('POST', 'http://api.mobiservices.vn/api/sms', {
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      json: jsonData
    });
    return JSON.parse(res.getBody('utf8'));
  }

  async getAccessToken(): Promise<string> {

    const body = {
      "email": process.env.ADMIN_USERNAME,
      "password": process.env.ADMIN_PASSWORD
    }

    const res = await this.calAPI(`${process.env.ODATA_URL}/login`, "POST", body);
    if (res && res.success === true) {
      return res.token;
    } else {
      return null
    }

  }
}