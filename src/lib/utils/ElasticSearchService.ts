import connect from "../utils/connect";
import { Utils } from "./utils";
const config = require('./../config');
export class ElasticSearchService {

    elasticsearch = require("elasticsearch");
    //Author function
    async DeleteAuthorIndex() {
        return this.DeleteIndex(config.ELASTICSEARCH_INDEX_AUTHOR);
    }
    async DeleteAuthorItem(id: number) {
        return this.DeleteDocument(config.ELASTICSEARCH_INDEX_AUTHOR, config.ELASTICSEARCH_TYPE_AUTHOR, id);
    }

    async SyncAllAuthor(): Promise<any> {
        const db = await connect();
        var bookDataset = await db.query('Select * from "Authors"');
        var arrSearchFiles = [];
        arrSearchFiles.push('Name');
        arrSearchFiles.push('BriefInfo');
        arrSearchFiles.push('Info');
        return await this.BulkInsert(bookDataset.rows, config.ELASTICSEARCH_INDEX_AUTHOR, config.ELASTICSEARCH_TYPE_AUTHOR, arrSearchFiles);
    }
    async SyncAuthor(id: number): Promise<any> {
        const db = await connect();
        var bookDataset = await db.query('Select * from "Authors" where "Id"=$1', [id]);
        var arrSearchFiles = [];
        arrSearchFiles.push('Name');
        arrSearchFiles.push('BriefInfo');
        arrSearchFiles.push('Info');
        return await this.BulkInsert(bookDataset.rows, config.ELASTICSEARCH_INDEX_AUTHOR, config.ELASTICSEARCH_TYPE_AUTHOR, arrSearchFiles);
    }
    async SearchAuthor(keyword: string, strFieldsGet: string, skip: number, take: number): Promise<any> {
        if (skip == null)
            skip = 0;
        if (take == null)
            take = parseInt(config.ELASTICSEARCH_DEFAULT_TAKE);

        return await this.Search(keyword, config.ELASTICSEARCH_INDEX_AUTHOR, config.ELASTICSEARCH_TYPE_AUTHOR, config.ELASTICSEARCH_SEARCHFIELDS_AUTHOR, strFieldsGet, skip, take);
    }
    async FSearchAuthor(keyword: string, strFieldsGet: string, skip: number, take: number): Promise<any> {
        if (skip == null)
            skip = 0;
        if (take == null)
            take = parseInt(config.ELASTICSEARCH_DEFAULT_TAKE);

        return await this.FSearch(keyword, config.ELASTICSEARCH_INDEX_AUTHOR, config.ELASTICSEARCH_TYPE_AUTHOR, config.ELASTICSEARCH_SEARCHFIELDS_AUTHOR, strFieldsGet, skip, take);
    }
    // End Author function

    //Book function
    async DeleteBookIndex() {
        return this.DeleteIndex(config.ELASTICSEARCH_INDEX_BOOK);
    }
    async DeleteBookItem(id: number) {
        return this.DeleteDocument(config.ELASTICSEARCH_INDEX_BOOK, config.ELASTICSEARCH_TYPE_BOOK, id);
    }

    async SyncAllBook(): Promise<any> {
        const db = await connect();
        var bookDataset = await db.query('Select * from "v_BookWithAuthorName"');
        var arrSearchFiles = [];
        arrSearchFiles.push('Name');
        arrSearchFiles.push('Description');
        arrSearchFiles.push('AuthorNames');
        return await this.BulkInsert(bookDataset.rows, config.ELASTICSEARCH_INDEX_BOOK, config.ELASTICSEARCH_TYPE_BOOK, arrSearchFiles);
    }
    async SyncBook(id: number): Promise<any> {
        const db = await connect();
        var bookDataset = await db.query('Select * from "v_BookWithAuthorName" where "Id"=$1', [id]);
        var arrSearchFiles = [];
        arrSearchFiles.push('Name');
        arrSearchFiles.push('Description');
        arrSearchFiles.push('AuthorNames');
        return await this.BulkInsert(bookDataset.rows, config.ELASTICSEARCH_INDEX_BOOK, config.ELASTICSEARCH_TYPE_BOOK, arrSearchFiles);
    }
    async SearchBook(keyword: string, strFieldsGet: string, skip: number, take: number): Promise<any> {
        if (skip == null)
            skip = 0;
        if (take == null)
            take = parseInt(config.ELASTICSEARCH_DEFAULT_TAKE);

        return await this.Search(keyword, config.ELASTICSEARCH_INDEX_BOOK, config.ELASTICSEARCH_TYPE_BOOK, config.ELASTICSEARCH_SEARCHFIELDS_BOOK, strFieldsGet, skip, take);
    }
    async FSearchBook(keyword: string, strFieldsGet: string, skip: number, take: number): Promise<any> {
        if (skip == null)
            skip = 0;
        if (take == null)
            take = parseInt(config.ELASTICSEARCH_DEFAULT_TAKE);

        return await this.FSearch(keyword, config.ELASTICSEARCH_INDEX_BOOK, config.ELASTICSEARCH_TYPE_BOOK, config.ELASTICSEARCH_SEARCHFIELDS_BOOK, strFieldsGet, skip, take);
    }

    async FSearchBookContains(keyword: string, strFieldsGet: string, skip: number, take: number): Promise<any> {
        if (skip == null)
            skip = 0;
        if (take == null)
            take = parseInt(config.ELASTICSEARCH_DEFAULT_TAKE);
        keyword += "*";

        return await this.FSearchContain(keyword, config.ELASTICSEARCH_INDEX_BOOK, config.ELASTICSEARCH_TYPE_BOOK, config.ELASTICSEARCH_SEARCHFIELDS_BOOK, strFieldsGet, skip, take);
    }
    // End book function

    // Share function
    async Search(keyword: string, indexName: string, typeName: string, searchFields: any, strFieldsGet: string, fromIndex: number, toIndex: number): Promise<any> {
        try {
            var keyword1 = await Utils.removeAccents(keyword);
            var client = new this.elasticsearch.Client({
                hosts: config.ELASTICSEARCH_HOST
            });
            var getFields = [];
            if (strFieldsGet && strFieldsGet != '') {
                getFields = strFieldsGet.split(',');
            }
            var body = null;
            body = {
                "query": {
                    "multi_match": {
                        "query": keyword1,
                        "operator": config.ELASTICSEARCH_SEARCHTYPE,
                        "fields": searchFields
                    }
                },
                "sort": [

                    { "_score": { "order": "desc" } }
                ],
                "from": fromIndex,
                "size": toIndex,
                "_source": getFields

            };

            var rs = await client.search({
                index: indexName,
                type: typeName,
                body: body
            }).then(function (response) {
                return response;
            });
            var data = [];
            for (var item of rs["hits"]["hits"]) {
                data.push(item["_source"]);
            }
            //   var total=rs["hits"]["total"]["value"];
            return { "success": true, "total": rs["hits"]["total"], "data": data };
        }
        catch (err) {
            return { "success": false, "data": err };
        }

    }
    async FSearchContain(keyword: string, indexName: string, typeName: string, searchFields: any, strFieldsGet: string, fromIndex: number, toIndex: number): Promise<any> {
        try {
            var client = new this.elasticsearch.Client({
                hosts: config.ELASTICSEARCH_HOST
            });
            var getFields = [];
            if (strFieldsGet && strFieldsGet != '') {
                getFields = strFieldsGet.split(',');
            }
            var body = null;
            body = {
                "query": {
                    "query_string": {
                        "fields": searchFields,
                        "query": keyword,
                        "default_operator": config.ELASTICSEARCH_SEARCHTYPE

                    }

                },
                "sort": [

                    { "_score": { "order": "desc" } }
                ],
                "from": fromIndex,
                "size": toIndex,
                "_source": getFields

            };

            var rs = await client.search({
                index: indexName,
                type: typeName,
                body: body
            }).then(function (response) {
                return response;
            });
            var data = [];
            for (var item of rs["hits"]["hits"]) {
                data.push(item["_source"]);
            }
            return { "success": true, "total": rs["hits"]["total"], "data": data };
        }
        catch (err) {
            return { "success": false, "data": err };
        }
    }
    async FSearch(keyword: string, indexName: string, typeName: string, searchFields: any, strFieldsGet: string, fromIndex: number, toIndex: number): Promise<any> {
        try {
            var client = new this.elasticsearch.Client({
                hosts: config.ELASTICSEARCH_HOST
            });
            var getFields = [];
            if (strFieldsGet && strFieldsGet != '') {
                getFields = strFieldsGet.split(',');
            }
            var body = null;
            body = {
                "query": {
                    "multi_match": {
                        "query": keyword,
                        "operator": config.ELASTICSEARCH_SEARCHTYPE,
                        "fields": searchFields,
                        "fuzziness": parseInt(config.ELASTICSEARCH_FUZZINESS)
                    }
                },
                "sort": [

                    { "_score": { "order": "desc" } }
                ],
                "from": fromIndex,
                "size": toIndex,
                "_source": getFields

            };

            var rs = await client.search({
                index: indexName,
                type: typeName,
                body: body
            }).then(function (response) {
                return response;
            });
            var data = [];
            for (var item of rs["hits"]["hits"]) {
                data.push(item["_source"]);
            }
            return { "success": true, "total": rs["hits"]["total"], "data": data };
        }
        catch (err) {
            return { "success": false, "data": err };
        }

    }
    async BulkInsert(data: any[], indexName: string, typeName: string, arrSearchFiles: any[]): Promise<any> {


        try {
            var client = new this.elasticsearch.Client({
                hosts: config.ELASTICSEARCH_HOST
            });
            var bulkBody = [];
            var cdata = null;
            var rdata = null;
            if (data && data.length > parseInt(config.ELASTICSEARCH_INSERT_MAX)) {
                cdata = data.slice(0, parseInt(config.ELASTICSEARCH_INSERT_MAX));
                rdata = data.slice(parseInt(config.ELASTICSEARCH_INSERT_MAX), data.length);
            }
            else
                cdata = data;

            for (var item of cdata) {
                for (var file of arrSearchFiles) {
                    if (item[file] != null && item[file] != '')
                        item[file + "1"] = await Utils.removeAccents(item[file]);
                }
                //  item["Name1"] =Utils.removeAccents(item["Name"]);
                bulkBody.push({ "index": { "_index": indexName, "_type": typeName, "_id": item["Id"] } });
                bulkBody.push(item);
            }
            var rs = null;
            rs = await client.bulk({ body: bulkBody })
                .then(response => {
                    console.log('here');
                    let errorCount = 0;
                    response.items.forEach(element => {
                        console.log(element);
                    });
                    return response;
                });
            var cRs = [];
            cRs.push(rs);
            if (rdata && rdata.length > 0) {
                var arrSubResult = await this.BulkInsert(rdata, indexName, typeName, arrSearchFiles);
                if (arrSubResult && arrSubResult.length > 0) {
                    for (var subResult of arrSubResult) {
                        cRs.push(subResult);
                    }
                }

            }
            return cRs;
        }
        catch (err) {
            return { "success": false, "data": err };
        }

    }
    async DeleteIndex(indexName: string) {
        try {
            var client = new this.elasticsearch.Client({
                hosts: config.ELASTICSEARCH_HOST
            });
            var rs = null;
            rs = await client.indices.delete({
                index: indexName,

            }).then(function (resp) {
                return { "success": true, "data": resp };
            }, function (err) {
                return { "success": false, "data": err };
            });

            return rs;
        }
        catch (err) {
            return { "success": false, "data": err };
        }

    }
    async DeleteDocument(indexName: string, typeName: string, id: number) {
        try {
            var client = new this.elasticsearch.Client({
                hosts: config.ELASTICSEARCH_HOST
            });
            var rs = await client.deleteByQuery({
                index: indexName,
                type: typeName,
                body: {
                    query: {
                        match: { _id: id }
                    }
                }
            }, function (error, response) {
                console.log(response);
                if (error)
                    return { "success": false, "data": error };
                else
                    return { "success": true, "data": response };
            });
            return rs;
        }
        catch (err) {
            return { "success": false, "data": err };
        }

    }
    // End Share function

}
