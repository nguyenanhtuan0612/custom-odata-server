import convertResults from '../utils/convertResults';
import { Utils } from '../utils/utils';
import connect from '../utils/connect';
import { ServiceHelper } from "./service";
import insert from '../utils/insert';
import { Notification } from '../../models/notification.model';
import { UserNotification } from '../../models/user-notification.model';
var excel = require('exceljs');
const sgMail = require('@sendgrid/mail');
const sgClient = require('@sendgrid/client');
const serviceHelper = new ServiceHelper();
export class OrderService {
  async getOrderSummary(
    filter: string): Promise<any> {
    try {
      console.log(filter);
      const db = await connect();
      let query = `select
      sum(o."Amount") "Amount",
      sum(o."TotalAmount") "TotalAmount",
      sum(o."Discount") "Discount"
    from
      "Orders" o
    join "Users" u on
      o."UserId" = u."Id"
      and (u."IsDeleted" <> true
      or u."IsDeleted" is null)
    where
      (o."IsDeleted" <> true
      or o."IsDeleted" is null)
      and o."Status" = 4`;
      var data = [];
      var nexDataIndex = 0;

      const conditions = [];
      if (filter['filters'] && filter['filters'].length > 0) {
        filter['filters'].forEach(element => {
          let field = element['field'];
          const search = element['search'];
          if (field === 'UserFullName' || field === 'UserEmail') {
            if (field === 'UserFullName') {
              field = 'FullName';
            } else if (field === 'UserEmail') {
              field = 'Email';
            }
            nexDataIndex++;
            data.push(search);
            conditions.push(`position($${nexDataIndex} in u."${field}") > 0`);
          } else if (field === "VipGroupIds") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`u."CurrentVipGroupId" = ANY($${nexDataIndex}::int[])`);
          } else if (field === "CreatedAtMin") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`date(o."CreatedAt") >= date($${nexDataIndex})`);
          } else if (field === "CreatedAtMax") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`date(o."CreatedAt") <= date($${nexDataIndex})`);
          } else if (field === "TotalAmountMin") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`o."TotalAmount" >= $${nexDataIndex}`);
          } else if (field === "TotalAmountMax") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`o."TotalAmount" <= $${nexDataIndex}`);
          } else if (field === "TotalQuantityMin") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`o."TotalQuantity" >= $${nexDataIndex}`);
          } else if (field === "TotalQuantityMax") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`o."TotalQuantity" <= $${nexDataIndex}`);
          } else if (field === "DiscountMin") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`o."Discount" >= $${nexDataIndex}`);
          } else if (field === "DiscountMax") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`o."Discount" <= $${nexDataIndex}`);
          }
        });
      }

      if (conditions.length > 0) {
        query += ` and ${conditions.join(' and ')}`
      }
      var { rows } = await db.query(query, data);
      var queryData = convertResults(rows);
      return queryData;
    } catch (error) {
      console.log(error);
    }
  }
}