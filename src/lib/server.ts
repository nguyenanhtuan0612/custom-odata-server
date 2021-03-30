import { ServiceMetadata } from "odata-v4-service-metadata";
import { ServiceDocument } from "odata-v4-service-document";
import { Edm as Metadata } from "odata-v4-metadata";
import * as ODataParser from "odata-v4-parser";
import { Token, TokenType } from "odata-v4-parser/lib/lexer";
import * as express from "express";
import * as http from "http";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import { Transform, TransformOptions } from "stream";
import { ODataResult } from "./result";
import { ODataController } from "./controller";
import * as odata from "./odata";
import { ODataBase, IODataConnector } from "./odata";
import { createMetadataJSON } from "./metadata";
import { ODataProcessor, ODataProcessorOptions, ODataMetadataType } from "./processor";
import { HttpRequestError, UnsupportedMediaTypeError } from "./error";
import { ContainerBase } from "./edm";
import { Readable, Writable } from "stream";
import { SecurityHelper } from "./utils/SecurityHelper";


const asyncRedis = require("async-redis");

const session = require('express-session');

let jwt = require('jsonwebtoken');
var fs = require('fs');
var util = require('util');
var logFile = fs.createWriteStream('customize_log.txt', { flags: 'a' });
// Or 'w' to truncate the file every time the process starts.
var logStdout = process.stdout;

console.info = function () {
    if (arguments && arguments.length > 0)
        arguments[0] = '' + new Date() + ':' + arguments[0];
    logFile.write(util.format.apply(null, arguments) + '\n');
    logStdout.write(util.format.apply(null, arguments) + '\n');
}
//console.error = console.log;
/** HTTP context interface when using the server HTTP request handler */
export interface ODataHttpContext {
    url: string
    method: string
    protocol: "http" | "https"
    host: string
    base: string
    request: express.Request & Readable
    response: express.Response & Writable
}
async function CheckPriviligeRequest(req) {
    var body = req.body;
    var token = null;
    try {
        var Authorization = req.headers["authorization"].toString();
        token = Authorization.replace('Bearer ', '').replace('bearer ', '');
        // var AuthorizationParts=Authorization.split('Bearer ');
        // if(AuthorizationParts&& AuthorizationParts.length>0)
        // {
        //    token=AuthorizationParts[1];
        // }
    }
    catch (err) {

    }

    var partnerid = '1';
    var sessionid = '';
    // fix bug partnerid is 1 when > 11
    if (req.headers["partnerid"]) {
        partnerid = req.headers["partnerid"].toString();
    }
    if (req.headers["sessionid"]) {
        sessionid = req.headers["sessionid"].toString();
    }
    var method = req.method;
    var originUrl = req.url;
    var url = req.url;
    try {
        if (url.length > 1)
            url = url.substr(1, url.length - 1);
    }
    catch (err) {

    }
    var splitChar = '?';
    var index = 10000;
    if (url.indexOf('/') < index && url.indexOf('/') >= 0) {
        splitChar = '/';
        index = url.indexOf('/');
    }
    
    var controllerName = url.split("(")[0];
    var idCheck = 0;
    try {
        idCheck = parseInt(originUrl.replace('/', '').replace(controllerName, '').replace('(', '').replace(')', ''));
    }
    catch (err) {

    }
    if (url.indexOf('(') < index && url.indexOf('(') >= 0 && idCheck > 0) {
        splitChar = '(';
        index = url.indexOf('(');
    }
    // var controllerName = url.split(splitChar)[0];
    // var id = 0;
    // if (method == "PUT" || method == "PATCH" || method == "DELETE" || method == "GET") {
    //     try {
    //         id = parseInt(originUrl.replace('/', '').replace(controllerName, '').replace('(', '').replace(')', ''));
    //     }
    //     catch (err) {

    //     }

    // }

    // return await CheckPrivilige(token, partnerid, method, controllerName, req.body, id);
    var decodeToken = jwt.decode(token);
    if (decodeToken && (decodeToken.preferred_username === process.env.KEYCLOAK_USER)) {
        return { "success": true, "message": "" };
    }
    var user_id = null;
    try {
        user_id = decodeToken.id;
    }
    catch (err) {

    }
    var isFunction = false;
    if (url.indexOf('/Mcbook.') >= 0)
        isFunction = true;
    if (!isFunction) {
        var controllerNames = url.split(splitChar)[0];

        var id = 0;
        if (method == "PUT" || method == "PATCH" || method == "DELETE" || method == "GET") {
            try {
                id = parseInt(originUrl.replace('/', '').replace(controllerNames, '').replace('(', '').replace(')', ''));
            }
            catch (err) {

            }

        }

        return await CheckPrivilige(token, partnerid, method, controllerNames, req.body, id);
    }
    else {
        try {
            var parts = url.split('(');
            var arrParams = [];
            var params = parts[1].replace(')', '');
            for (var item of params.split(',')) {
                var itemparts = item.split('=');
                var paramName = itemparts[0].toString();
                arrParams.push({ "key": itemparts[0], "value": itemparts[1] });

            }
            return await CheckPrivilegeFunction(user_id, parts[0], arrParams);

        }
        catch (error) {
            return { "success": true, "message": "" };
        }
    }
}

async function CheckPrivilegeFunction(user_id: string, fName: string, fParams: Object) {
    return await SecurityHelper.CheckPrivilegeFunction(user_id, fName, fParams);
    // return true;
}
async function CheckPrivilige(token: string, partnerId: string, method: string, controllerName: string, data: JSON, id: number) {
    var decodeToken = jwt.decode(token);
    if (decodeToken && (decodeToken.preferred_username === "admin1" || decodeToken.preferred_username === "admin")) {
        return { "success": true, "message": "" };
    }
    var user_id = null;
    try {
        user_id = decodeToken.id;
    }
    catch (err) {

    }
    return await SecurityHelper.CheckPrivilige(user_id, partnerId, method, controllerName, data, id);
    // return true;
}
function Apply_Partner_Filter(url: string, partnerid: number, affiliateid: number) {
    url = url.replace(/[\/]+/g, "/").replace(":/", "://");
    url = url.split('+').join('%20');
    url = decodeURIComponent(url);
    console.info(url);
    if (url.indexOf('/Mcbook.') >= 0) {
        var arr1 = url.split('(');
        if (arr1 && arr1.length > 1) {
            var arr2 = arr1[1].split(')');
            if (arr2 && arr2.length > 0) {
                var allParams = arr2[0].replace(' ', '');
                if (allParams.length > 0) {
                    url = url.replace(')', ',_h_partnerid=' + partnerid + ',_h_affiliateid=' + affiliateid + ')');
                }
                else {
                    url = url.replace(')', '_h_partnerid=' + partnerid + ',_h_affiliateid=' + affiliateid + ')');
                }
            }

        }


    }
    else {
        if (partnerid > 1) {
            if ((url.indexOf('/Books') == 0 || url.indexOf('/Categories') == 0 || url.indexOf('/Authors') == 0 || url.indexOf('/Subscribers') == 0)
                && (url.indexOf('/Books(') < 0 && url.indexOf('/Categories(') < 0 && url.indexOf('/Authors(') < 0 && url.indexOf('/Subscribers(') < 0)) {
                var referenceModelName = 'PartnerBooks1';
                if (url.indexOf('/Categories') == 0)
                    referenceModelName = 'PartnerCategory1';
                else if (url.indexOf('/Authors') == 0)
                    referenceModelName = 'PartnerAuthors1';
                else if (url.indexOf('/Subscribers') == 0)
                    referenceModelName = 'SubscriberCategories';
                // url=url+"?$filter=ParnterBooks1/any(x:x/PartnerId eq "+partnerid+")";
                if (url.indexOf('$filter=') >= 0) {
                    url = url.replace('$filter=', '$filter=' + referenceModelName + '/any(x:x/PartnerId eq ' + partnerid + ') and ');
                }
                else {
                    if (url.indexOf('?') >= 0) {
                        url = url + '&$filter=' + referenceModelName + '/any(x:x/PartnerId eq ' + partnerid + ')';
                    }
                    else {
                        url = url + '?$filter=' + referenceModelName + '/any(x:x/PartnerId eq ' + partnerid + ')';
                    }
                }
            }
        } else {
            //subscriber for case MCBOOKS
            if (url.indexOf('/Subscribers') == 0 && url.indexOf('/Subscribers(') < 0) {
                if (url.indexOf('$filter=') >= 0) {
                    url = url.replace('$filter=', '$filter=SubscriberCategories/any(x:x/PartnerId eq ' + partnerid + ') and ');
                }
                else {
                    if (url.indexOf('?') >= 0) {
                        url = url + '&$filter=SubscriberCategories/any(x:x/PartnerId eq ' + partnerid + ')';
                    }
                    else {
                        url = url + '?$filter=SubscriberCategories/any(x:x/PartnerId eq ' + partnerid + ')';
                    }
                }
            }
        }

        if (url.indexOf('/Books(') >= 0 || url.indexOf('/Authors(') >= 0) {
            if (url.indexOf('$filter=') >= 0) {
                url = url.replace('$filter=', '$filter=Id eq ' + partnerid + ' and ');
            }
            else {
                if (url.indexOf('?') >= 0) {
                    url = url + '&$filter=Id eq ' + partnerid;
                }
                else {
                    url = url + '?$filter=Id eq ' + partnerid;
                }
            }
        }


        if ((url.indexOf('/Articles') == 0 && url.indexOf('/Articles(') < 0)
            || (url.indexOf('/ACategories') == 0 && url.indexOf('/ACategories(') < 0)
            || (url.indexOf('/BookEvaluates') == 0 && url.indexOf('/BookEvaluates(') < 0)
            || (url.indexOf('/BookReserves') == 0 && url.indexOf('/BookReserves(') < 0)
            || (url.indexOf('/HotDeal') == 0 && url.indexOf('/HotDeal(') < 0)
            || (url.indexOf('/MemberActions') == 0 && url.indexOf('/MemberActions(') < 0)
            || (url.indexOf('/v_member_actions') == 0 && url.indexOf('/v_member_actions(') < 0)
            // || url.indexOf('/MemberDeliveryInfos') == 0
            || (url.indexOf('/Notifications') == 0 && url.indexOf('/Notifications(') < 0)
            || (url.indexOf('/Orders') == 0 && url.indexOf('/Orders(') < 0)
            || (url.indexOf('/v_orders') == 0 && url.indexOf('/v_orders(') < 0)
            || (url.indexOf('/Promotions') == 0 && url.indexOf('/Promotions(') < 0)
            || (url.indexOf('/v_hotdeal') == 0 && url.indexOf('/v_hotdeal(') < 0)
            || (url.indexOf('/v_delivery') == 0 && url.indexOf('/v_delivery(') < 0)
            || (url.indexOf('/Members') == 0 && url.indexOf('/Members(') < 0)

        ) {
            // MC Books can view all Members
            if (partnerid == 1 && url.indexOf('/Members') == 0) {
                // ignore filter
            }
            // MC Books can view all v_orders -> this is for BE, only BE using v_orders
            else if (partnerid == 1 && url.indexOf('/v_orders') == 0) {
                // ignore filter
            }
            // MC Books can view all v_delivery -> this is for BE, only BE using v_delivery
            else if (partnerid == 1 && url.indexOf('/v_delivery') == 0) {
                // ignore filter
            }
            // Ignore filter for Bai viet cua CTV
            else if (partnerid == 1 && url.indexOf('/Articles') == 0 && url.indexOf('MCBooksRequestApprovalStatus') != -1) {
                // ignore filter
            }
            // If filter contains user_id condition -> ignore filter by partnerid (FE needs this logic to can get member at the first time open FE page)
            else if (url.indexOf('user_id') != -1) {
                // ignore filter
            }
            // If query to get information of correct members with member id -> need to ignore filter because partner id
            else if (url.indexOf('/Members(') == 0) {
                // ignore filter
            }
            else {
                // add fitler for partner

                if (url.indexOf('$filter=') >= 0) {
                    url = url.replace('$filter=', '$filter=PartnerId eq ' + partnerid + ' and ');
                }
                else {
                    if (url.indexOf('?') >= 0) {
                        url = url + '&$filter=PartnerId eq ' + partnerid;
                    }
                    else {
                        url = url + '?$filter=PartnerId eq ' + partnerid;
                    }
                }
            }
        }
    }
    if (url.indexOf('Mcbook.getPartnerByUrl(') >= 0 || url.indexOf('Mcbook.checkExistingPartnerByWebsite(') >= 0) {
        var extractdata = url.match(/\'(.*?)\'/g);
        if (extractdata && extractdata.length > 0) {
            var cValue = replaceAll(extractdata[0], '/', '_P_V_A_L_U_E');  // extractdata[0].replace('/','_P_V_A_L_U_E');
            url = url.replace(extractdata[0], cValue);
        }
    }

    console.log("Before add IsDeleted: " + url);
    // filter to ingore records which IsDeleted=true
    // we have to re-check all views to ignore records which IsDeleted=true so don't need to filter for views
    // ignore query to corrent a record with id like /Books(12)
    // ignore functions (if not ingore -> so slow this is bug of odata server)
    var tableWithId = new RegExp(/^\/[a-zA-Z]*\([1-9]*\)/);
    var isTableWithId = tableWithId.test(url);
    var tempUrlRemoveChildFilter = replaceAll(url, '($filter=', '');
    if (url.startsWith("/v_") == false && url.indexOf('/Mcbook.') == -1) {
        if (url.indexOf("$filter=") != - 1 && tempUrlRemoveChildFilter.indexOf("$filter=") != - 1) {
            const temp1 = url.split("$filter=");
            const temp2 = temp1[1].split("&");
            const currentCondition = temp2[0];
            const newCondition = `(${currentCondition}) and IsDeleted ne true`
            url = url.replace(currentCondition, newCondition);
        } else {
            if (url.indexOf("?") != -1) {
                url = url + "&$filter=IsDeleted ne true";
            } else {
                url = url + "?$filter=IsDeleted ne true";
            }
        }
    }

    console.log("After add IsDeleted: " + url);

    return url;
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function ensureODataMetadataType(req, res) {
    let metadata: ODataMetadataType = ODataMetadataType.minimal;
    if (req.headers && req.headers.accept && req.headers.accept.indexOf("odata.metadata=") >= 0) {
        if (req.headers.accept.indexOf("odata.metadata=full") >= 0) metadata = ODataMetadataType.full;
        else if (req.headers.accept.indexOf("odata.metadata=none") >= 0) metadata = ODataMetadataType.none;
    }

    res["metadata"] = metadata;
}
function ensureODataContentType(req, res, contentType?) {
    contentType = contentType || "application/json";
    if (contentType.indexOf("odata.metadata=") < 0) contentType += `;odata.metadata=${ODataMetadataType[res["metadata"]]}`;
    if (contentType.indexOf("odata.streaming=") < 0) contentType += ";odata.streaming=true";
    if (contentType.indexOf("IEEE754Compatible=") < 0) contentType += ";IEEE754Compatible=false";
    if (req.headers.accept && req.headers.accept.indexOf("charset") > 0) {
        contentType += `;charset=${res["charset"]}`;
    }
    res.contentType(contentType);
}
function ensureODataHeaders(req, res, next?) {
    /*
      if(!req.url.startsWith('/Users/Mcbook.Login'))
      {
        //begin authentication
            let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
            if (token&&token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);              }
            if (token) {
                jwt.verify(token, 'worldisfullofdevelopers', (err, decoded) => {
                if (err) {
                    throw  err;
                } else {
                    req.decoded = decoded;
                    //next();
                }
                });
            } else {
                throw new Error('token does not exist');
            }

        //end authentication
      }
      */

    res.setHeader("OData-Version", "4.0");

    ensureODataMetadataType(req, res);
    let charset = req.headers["accept-charset"] || "utf-8";
    res["charset"] = charset;
    ensureODataContentType(req, res);

    if ((req.headers.accept && req.headers.accept.indexOf("charset") < 0) || req.headers["accept-charset"]) {
        const bufferEncoding = {
            "utf-8": "utf8",
            "utf-16": "utf16le"
        };
        let origsend = res.send;
        res.send = <any>((data) => {
            if (typeof data == "object") data = JSON.stringify(data);
            origsend.call(res, Buffer.from(data, bufferEncoding[charset]));
        });
    }

    if (typeof next == "function") next();
}
function startsWith(str, word) {
    return str.lastIndexOf(word, 0) === 0;
}
/** ODataServer base class to be extended by concrete OData Server data sources */
(ODataParser.parserFactory as any) = function(fn) {
    return function (source, options) {
        source = source.replace("//", "/");
        // let originSource = "$top=2&$filter=Id gt -1 and (Products/any(x:x/Id lt 100))&$expand=Products";
        // \b\w*/any\([^\(]*\([^\)]*\)\)|\b\w*/any\([^\)(^\{]*\)
        let originSource = source;
       let testString = "(x:x/TotalPrice/Id eq null or x/TotalPrice lt 1000000000 or x/Id eq 1)";
    // \b\w*/any\(\w:\w([/\w+]*/\w+[\040]+\w+[\040]+\w+|\w*\(\w[/w+]*/\w+,'.*'\))([\040]+(and|or)[\040]+(\w[/\w+]*/\w+[\040]+\w+[\040]+\w+|\w*\(\w[/w+]*/\w+,'.*'\)))*\)
       let match1 = testString.match(/\b\w*[/\w*]* \b\w* \b\w*/g);
        let match = source.match(/\b\w*\/any\(\w:(\w*\(\w[/\w+]*\/\w+,'[^()]*'\)|(\w[/\w+]*\/\w+[\040]\w+[\040](\w+|'[^'].*')))([\040]+(and|or)[\040]+(\w*\(\w[/\w+]*\/\w+,'[^()]*'\)|(\w[/\w+]*\/\w+[\040]\w+[\040](\w+|'[^'].*'))))*\)/g);

        if (match != null && match.length > 0)
        match.forEach(element => {
            let part2 = element.split("/any")[1];
            // part2 = part2.replace("(", "").replace(")", "");
            part2 = part2.substring(3, part2.length - 1);
            let part2ArrayAnd = part2.split(" and ");
            let arrPart2 = [];
            for (let i = 0; i < part2ArrayAnd.length; i++) {
                arrPart2 = arrPart2.concat(part2ArrayAnd[i].split(" or "));
            }
            // x:contains(x/Name,'1') and x/Id eq 1
            let part2Array = part2.split(" ") ;
            let numberOfCoditions = arrPart2.length;
            let replaceValue = "";
            if (numberOfCoditions > 0) {
                let matchfirtElement = arrPart2[0].match(/\w*\(\w[/\w+]*\/\w+,'[^'].*'\)/);
                if (matchfirtElement != null || arrPart2[0].match(/\w[/\w+]*\/\w+[\040]\w+[\040]'[^'].*'/) != null)
                replaceValue = "Id eq '-9999999.99999999'";
                else
                replaceValue = "Id eq -9999999.99999999";
                let index = 1;
                while (index < numberOfCoditions) {
                 //   let matchOthersElement = arrPart2[index].match(/\w*\(\w[/w+]*\/\w+,'[^'].*'\)/);
                      let matchOthersElement = arrPart2[index].match(/\w*\(\w[/\w+]*\/\w+,'[^'].*'\)/);
                    // \w*\(\w[/\w+]*/\w+,'[^'].*'\)
                    if (matchOthersElement != null || arrPart2[index].match(/\w[/\w+]*\/\w+[\040]\w+[\040]'[^'].*'/) != null)
                    replaceValue += " and Id eq '-9999999.99999999'";
                    else
                    replaceValue += " and Id eq -9999999.99999999";
                    index++;
                }
                source =   source.replace(element, replaceValue);
            }

        });
        // let temp = match[0];
      //  source = source.replace(temp, "Id eq -10000000");
        options = options || {};
        const raw = new Uint16Array(source.length);
        let pos = 0;
        for (let i = 0; i < source.length; i++) {
            raw[i] = source.charCodeAt(i);
        }
        let result = fn(raw, pos, options.metadata);
        if (!result) throw new Error("Fail at " + pos);
        if (result.next < raw.length) throw new Error("Unexpected character at " + result.next);
        try {

            result.value.query.raw =  originSource.split("?")[1];
        }
        catch (error) {}

        return result;
    };
};
export class ODataServerBase extends Transform {
    private static _metadataCache: any
    static namespace: string
    static container = new ContainerBase();
    static parser = ODataParser;
    static connector: IODataConnector
    static validator: (odataQuery: string | Token) => null;
    static errorHandler: express.ErrorRequestHandler = ODataErrorHandler;
    private serverType: typeof ODataServer

    static async mytestfunction() {
        var myCache = null;
        var cacheKey = 'BOOK:CACHEBLOCK:ISNEW';
        myCache = asyncRedis.createClient(6379, '192.168.118.122');
        var data = await myCache.get(cacheKey);
        //   console.log('data='+data);
        return data;
    }
    static requestHandler() {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            try {



                ensureODataHeaders(req, res);
                let processor = this.createProcessor({
                    url: req.url,
                    method: req.method,
                    protocol: req.secure ? "https" : "http",
                    host: req.headers.host,
                    base: req.baseUrl,
                    request: req,
                    response: res
                }, <ODataProcessorOptions>{
                    metadata: res["metadata"]
                });
                processor.on("header", (headers) => {
                    for (let prop in headers) {
                        if (prop.toLowerCase() == "content-type") {
                            ensureODataContentType(req, res, headers[prop]);
                        } else {
                            // if(headers[prop]==undefined )
                            // headers[prop]='http://localhost/odata/Categories(11)/$value';
                            if ((prop) && (headers[prop])) {
                                res.setHeader(prop, headers[prop]);
                            }
                        }
                    }
                });



                // this.mytestfunction().then(
                //     console.log
                // );



                let hasError = false;
                processor.on("data", (chunk, encoding, done) => {
                    if (!hasError) {
                        res.write(chunk, encoding, done);
                    }
                });
                let body = req.body && Object.keys(req.body).length > 0 ? req.body : req;
                let origStatus = res.statusCode;
                processor.execute(body).then((result: ODataResult) => {
                    try {
                        if (result) {
                            res.status((origStatus != res.statusCode && res.statusCode) || result.statusCode || 200);
                            if (!res.headersSent) {
                                ensureODataContentType(req, res, result.contentType || "text/plain");
                            }
                            if (typeof result.body != "undefined") {
                                if (typeof result.body != "object") res.send("" + result.body);
                                else if (!res.headersSent) res.send(result.body);
                            }
                        }
                        res.end();
                    } catch (err) {
                        hasError = true;
                        next(err);
                    }
                }, (err) => {
                    hasError = true;
                    next(err);
                });
            } catch (err) {
                next(err);
            }
        };
    }

    static execute<T>(url: string, body?: object): Promise<ODataResult<T>>;
    static execute<T>(url: string, method?: string, body?: object): Promise<ODataResult<T>>;
    static execute<T>(context: object, body?: object): Promise<ODataResult<T>>;
    static execute<T>(url: string | object, method?: string | object, body?: object): Promise<ODataResult<T>> {
        let context: any = {};
        if (typeof url == "object") {
            context = Object.assign(context, url);
            if (typeof method == "object") {
                body = method;
            }
            url = undefined;
            method = undefined;
        } else if (typeof url == "string") {
            context.url = url;
            if (typeof method == "object") {
                body = method;
                method = "POST";
            }
            context.method = method || "GET";
        }
        context.method = context.method || "GET";
        let processor = this.createProcessor(context, <ODataProcessorOptions>{
            objectMode: true,
            metadata: context.metadata || ODataMetadataType.minimal
        });
        let values = [];
        let flushObject;
        let response = "";
        if (context.response instanceof Writable) processor.pipe(context.response);
        processor.on("data", (chunk: any) => {
            if (!(typeof chunk == "string" || chunk instanceof Buffer)) {
                if (chunk["@odata.context"] && chunk.value && Array.isArray(chunk.value) && chunk.value.length == 0) {
                    flushObject = chunk;
                    flushObject.value = values;
                } else {
                    values.push(chunk);
                }
            } else response += chunk.toString();
        });
        return processor.execute(context.body || body).then((result: ODataResult<T>) => {
            if (flushObject) {
                result.body = flushObject;
                if (!result.elementType || typeof result.elementType == "object") result.elementType = flushObject.elementType;
                delete flushObject.elementType;
                result.contentType = result.contentType || "application/json";
            } else if (result && response) {
                result.body = <any>response;
            }
            return result;
        });
    }

    constructor(opts?: TransformOptions) {
        super(Object.assign(<TransformOptions>{
            objectMode: true
        }, opts));
        this.serverType = Object.getPrototypeOf(this).constructor;
    }

    _transform(chunk: any, _?: string, done?: Function) {
        if ((chunk instanceof Buffer) || typeof chunk == "string") {
            try {
                chunk = JSON.parse(chunk.toString());
            } catch (err) {
                return done(err);
            }
        }
        this.serverType.execute(chunk).then((result) => {
            this.push(result);
            if (typeof done == "function") done();
        }, <any>done);
    }

    _flush(done?: Function) {
        if (typeof done == "function") done();
    }

    static createProcessor(context: any, options?: ODataProcessorOptions) {
        return new ODataProcessor(context, this, options);
    }

    static $metadata(): ServiceMetadata;
    static $metadata(metadata: Metadata.Edmx | any);
    static $metadata(metadata?): ServiceMetadata {
        if (metadata) {
            if (!(metadata instanceof Metadata.Edmx)) {
                if (metadata.version && metadata.dataServices && Array.isArray(metadata.dataServices.schema)) this._metadataCache = ServiceMetadata.processMetadataJson(metadata);
                else this._metadataCache = ServiceMetadata.defineEntities(metadata);
            }
        }
        return this._metadataCache || (this._metadataCache = ServiceMetadata.processMetadataJson(createMetadataJSON(this)));
    }

    static document(): ServiceDocument {
        return ServiceDocument.processEdmx(this.$metadata().edmx);
    }

    static addController(controller: typeof ODataController, isPublic?: boolean);
    static addController(controller: typeof ODataController, isPublic?: boolean, elementType?: Function);
    static addController(controller: typeof ODataController, entitySetName?: string, elementType?: Function);
    static addController(controller: typeof ODataController, entitySetName?: string | boolean, elementType?: Function) {
        odata.controller(controller, <string>entitySetName, elementType)(this);
    }
    static getController(elementType: Function) {
        for (let i in this.prototype) {
            if (this.prototype[i] &&
                this.prototype[i].prototype &&
                this.prototype[i].prototype instanceof ODataController &&
                this.prototype[i].prototype.elementType == elementType) {
                return this.prototype[i];
            }
        }
        return null;
    }

    static create(): express.Router;
    static create(port: number): http.Server;
    static create(path: string, port: number): http.Server;
    static create(port: number, hostname: string): http.Server;
    static create(path?: string | RegExp | number, port?: number | string, hostname?: string): http.Server;
    static create(path?: string | RegExp | number, port?: number | string, hostname?: string): http.Server | express.Router {
        let server = this;
        let router = express.Router();
        // router.use((req, _, next) => {
        //     req.url = req.url.replace(/[\/]+/g, "/").replace(":/", "://");
        //     if (req.headers["odata-maxversion"] && req.headers["odata-maxversion"] < "4.0") return next(new HttpRequestError(500, "Only OData version 4.0 supported"));
        //     next();
        // });

        router.use((req, _, next) => {


            //  var partnerid = '1';
            //  // fix bug partnerid is 1 when > 11
            //  if (req.headers["partnerid"]) {
            //      partnerid = req.headers["partnerid"].toString();
            //  }    

            //         //var partnerid = '1';
            //         // fix bug partnerid is 1 when > 11
            //         // if (req.headers["partnerid"]) {
            //         //     partnerid = req.headers["partnerid"].toString();
            //         // }
            var partnerid = '1';
            var affiliateid = '0';
            // fix bug partnerid is 1 when > 11
            if (req.headers["partnerid"]) {
                partnerid = req.headers["partnerid"].toString();
            }
            if (req.headers["affiliateid"]) {
                affiliateid = req.headers["affiliateid"].toString();
            }
            if (partnerid && req.method == 'GET') {
                req.url = Apply_Partner_Filter(req.url, parseInt(partnerid), parseInt(affiliateid));
                req.originalUrl = Apply_Partner_Filter(req.originalUrl, parseInt(partnerid), parseInt(affiliateid));
            }
            req.url = req.url.replace(/[\/]+/g, "/").replace(":/", "://");
            req.url = req.url.split('+').join('%20');
            // req.url = req.url.split('/').join('%2F');
            req.url = decodeURIComponent(req.url);
            req.originalUrl = req.originalUrl.split('+').join('%20');
            // req.originalUrl = req.originalUrl.split('/').join('%2F');
            req.originalUrl = decodeURIComponent(req.originalUrl);
            // return next(new HttpRequestError(401, "Unauthorize"));
            //originalUrl
            if (req.headers["odata-maxversion"] && req.headers["odata-maxversion"] < "4.0") return next(new HttpRequestError(500, "Only OData version 4.0 supported"));
            next();
        });
        router.use(bodyParser.json({ limit: '10mb' }));
        if ((<any>server).cors) router.use(cors());
        router.use((req, res, next) => {
            var body = req.body;
            CheckPriviligeRequest(req).then((checkPriviligeResult) => {
                if (!checkPriviligeResult["success"])
                    return next(new HttpRequestError(401, checkPriviligeResult["message"]));
                else {
                    res.setHeader("OData-Version", "4.0");
                    if (req.headers.accept &&
                        req.headers.accept.indexOf("application/json") < 0 &&
                        req.headers.accept.indexOf("text/html") < 0 &&
                        req.headers.accept.indexOf("*/*") < 0 &&
                        req.headers.accept.indexOf("xml") < 0) {
                        next(new UnsupportedMediaTypeError());
                    } else next();
                }
            });

            // var havePrivilige=await CheckPriviligeRequest(req);


        });
        router.get("/", ensureODataHeaders, (req, _, next) => {
            if (typeof req.query == "object" && Object.keys(req.query).length > 0) return next(new HttpRequestError(500, "Unsupported query"));
            next();
        }, server.document().requestHandler());
        router.get("/\\$metadata", server.$metadata().requestHandler());
        router.use(server.requestHandler());
        router.use(server.errorHandler);

        if (typeof path == "number") {
            if (typeof port == "string") {
                hostname = "" + port;
            }
            port = parseInt(<any>path, 10);
            path = undefined;
        }
        if (typeof port == "number") {
            let app = express();
            // var memoryStore = new session.MemoryStore();
            // app.use(session({
            //     secret:'thisShouldBeLongAndSecret',
            //     resave: false,
            //     saveUninitialized: true,
            //     store: memoryStore
            //   }));

            // var keycloak = new Keycloak({ store: memoryStore });
            // app.use(keycloak.middleware());
            app.use((<any>path) || "/", router);
            //app.use(fileUpload());

            return app.listen(port, <any>hostname);
        }
        return router;
    }
}
export class ODataServer extends ODataBase<ODataServerBase, typeof ODataServerBase>(ODataServerBase) { }

/** ?????????? */
/** Create Express middleware for OData error handling */
export function ODataErrorHandler(err, _, res, next) {
    if (err) {
        if (res.headersSent) {
            return next(err);
        }
        let statusCode = err.statusCode || err.status || (res.statusCode < 400 ? 500 : res.statusCode);
        if (!res.statusCode || res.statusCode < 400) res.status(statusCode);
        res.send({
            error: {
                code: statusCode,
                message: err.message,
                stack: process.env.ODATA_V4_DISABLE_STACKTRACE ? undefined : err.stack
            }
        });
    } else next();
}

/** Create Express server for OData Server
 * @param server OData Server instance
 * @return       Express Router object
 */
export function createODataServer(server: typeof ODataServer): express.Router;
/** Create Express server for OData Server
 * @param server OData Server instance
 * @param port   port number for Express to listen to
 */
export function createODataServer(server: typeof ODataServer, port: number): http.Server;
/** Create Express server for OData Server
 * @param server OData Server instance
 * @param path   routing path for Express
 * @param port   port number for Express to listen to
 */
export function createODataServer(server: typeof ODataServer, path: string, port: number): http.Server;
/** Create Express server for OData Server
 * @param server   OData Server instance
 * @param port     port number for Express to listen to
 * @param hostname hostname for Express
 */
export function createODataServer(server: typeof ODataServer, port: number, hostname: string): http.Server;
/** Create Express server for OData Server
 * @param server   OData Server instance
 * @param path     routing path for Express
 * @param port     port number for Express to listen to
 * @param hostname hostname for Express
 * @return         Express Router object
 */
export function createODataServer(server: typeof ODataServer, path?: string | RegExp | number, port?: number | string, hostname?: string): http.Server | express.Router {
    return server.create(path, port, hostname);
}
