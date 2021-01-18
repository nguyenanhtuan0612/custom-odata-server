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
export class UserService {
  async exportApprovedCustomerToExcel(req, res): Promise<any> {
    try {
      var workbook = new excel.Workbook(); //creating workbook
      var sheet = workbook.addWorksheet('Khách hàng'); //creating worksheet

      var headers = [
        { header: 'Mã khách hàng', key: 'Code', width: 20 }, // i need something like headerRow:2
        { header: 'Tên khách hàng', key: 'FullName', width: 30 }, // i need something like headerRow:2
        { header: 'Email', key: 'Email', width: 30 },
        { header: 'Điện thoại', key: 'Tel', width: 20 },
        { header: 'Gói VIP', key: 'VipGroupName', width: 30 },
        { header: 'Ngày đăng kí', key: 'RegisterTime', style: { numFmt: 'DD/MM/YYYY HH:mm:ss' }, width: 22 },
        { header: 'Người quản lý', key: 'UserCareFullName', width: 30 },
        { header: 'Địa chỉ', key: 'Address', width: 50 },
      ];
      sheet.columns = headers;
      var data = await this.getUsers(
        req.body.filter,
        req.body.orderby,
        req.body.limit,
        null,
        -1,
        'excel');

      // rebuild address
      data.forEach(u => {
        const address = [];
        if (u.Address) {
          address.push(u.Address);
        }
        if (u.DistrictName) {
          address.push(u.DistrictName);
        }
        if (u.CityName) {
          address.push(u.CityName);
        }
        u.Address = address.join(', ');
      });

      sheet.addRows(data);
      // set style for each cell
      sheet.eachRow(function (Row, rowNum) {
        /** Row.alignment not work */
        // Row.alignment = { horizontal: 'left' }

        Row.eachCell(function (Cell, cellNum) {
          /** cell.alignment not work */
          if (rowNum == 1) {
            Cell.alignment = {
              vertical: 'middle',
              horizontal: 'center'
            };
            Cell.font = {
              bold: true
            };
          } else {
            // if (cellNum == 7) {
            //   Cell.alignment = {
            //     wrapText: true,
            //     horizontal: 'center'
            //   };
            // } else {
            //   Cell.alignment = {
            //     wrapText: true
            //   };
            // }
          }
        })
      })

      workbook.xlsx.writeFile('./temp.xlsx').then(function () {
      });

      var tempfile = require('tempfile');
      var tempFilePath = tempfile('.xlsx');
      workbook.xlsx.writeFile(tempFilePath).then(function () {
        res.sendFile(tempFilePath, function (err) {
        });
      });
    }
    catch (err) {
      res.status(500).json(err);
    }
  }

  async exportApprovedCustomerReport(req, res): Promise<any> {
    try {
      var workbook = new excel.Workbook(); //creating workbook
      var sheet = workbook.addWorksheet('Khách hàng'); //creating worksheet

      var headers = [
        { header: 'Mã khách hàng', key: 'Code', width: 20 }, // i need something like headerRow:2
        { header: 'Tên khách hàng', key: 'FullName', width: 30 }, // i need something like headerRow:2
        { header: 'Email', key: 'Email', width: 30 },
        { header: 'Điện thoại', key: 'Tel', width: 20 },
        { header: 'Gói VIP', key: 'VipGroupName', width: 30 },
        { header: 'Ngày đăng kí', key: 'RegisterTime', style: { numFmt: 'DD/MM/YYYY HH:mm:ss' }, width: 22 },
        { header: 'Người quản lý', key: 'UserCareFullName', width: 30 },
        { header: 'Địa chỉ', key: 'Address', width: 50 },
        { header: 'Doanh thu', key: 'Revenue', width: 50 },
      ];
      sheet.columns = headers;
      var data = await this.getUsers(
        req.body.filter,
        req.body.orderby,
        req.body.limit,
        null,
        -1,
        'excel');

      // rebuild address
      data.forEach(u => {
        const address = [];
        if (u.Address) {
          address.push(u.Address);
        }
        if (u.DistrictName) {
          address.push(u.DistrictName);
        }
        if (u.CityName) {
          address.push(u.CityName);
        }
        u.Address = address.join(', ');
      });

      sheet.addRows(data);
      // set style for each cell
      sheet.eachRow(function (Row, rowNum) {
        /** Row.alignment not work */
        // Row.alignment = { horizontal: 'left' }

        Row.eachCell(function (Cell, cellNum) {
          /** cell.alignment not work */
          if (rowNum == 1) {
            Cell.alignment = {
              vertical: 'middle',
              horizontal: 'center'
            };
            Cell.font = {
              bold: true
            };
          } else {
            // if (cellNum == 7) {
            //   Cell.alignment = {
            //     wrapText: true,
            //     horizontal: 'center'
            //   };
            // } else {
            //   Cell.alignment = {
            //     wrapText: true
            //   };
            // }
          }
        })
      })

      workbook.xlsx.writeFile('./temp.xlsx').then(function () {
      });

      var tempfile = require('tempfile');
      var tempFilePath = tempfile('.xlsx');
      workbook.xlsx.writeFile(tempFilePath).then(function () {
        res.sendFile(tempFilePath, function (err) {
        });
      });
    }
    catch (err) {
      res.status(500).json(err);
    }
  }

  async sendBulkNotifications(req, limit, offset, totalRecord): Promise<any> {
    var data = await this.getUsers(
      req.body.filter,
      req.body.orderby,
      limit,
      offset,
      -1,
      'notification');
    offset = data.next_offset;
    totalRecord = data.count;
    if (data.value.length > 0) {
      const result = await this.sendNotification(req, data.value);
    }
    if (data.value.length === limit) {
      this.sendBulkNotifications(req, limit, offset, totalRecord);
    }
  }

  async sendNotification(req, users): Promise<any> {
    const notifications = [];
    notifications.push(new Notification(req.body.noti_type, req.body.noti_subject, req.body.noti_content));
    const db = await connect();
    const insertResult = await insert(db, "Notifications", notifications);

    if (req.body.noti_type == 2) {
      // Thong bao ca nhan
      const userNotifications = [];
      users.forEach(u => {
        userNotifications.push(new UserNotification(u["Id"], insertResult.rows[0].Id));
      });
      const insertResult2 = await insert(db, "UserNotifications", userNotifications);
    }

    // TODO send app noti

    return { insertResult };
  }

  async sendBulkEmailsToCustomers(req, limit, offset, totalRecord): Promise<any> {
    var data = await this.getUsers(
      req.body.filter,
      req.body.orderby,
      limit,
      offset,
      -1,
      'notification');
    offset = data.next_offset;
    totalRecord = data.count;
    if (data.value.length > 0) {
      const result = await this.sendEmailsToCustomers(data.value, req.body.Subject, req.body.Body);
    }
    if (data.value.length === limit) {
      this.sendBulkEmailsToCustomers(req, limit, offset, totalRecord);
    }
  }

  async sendEmailsToCustomers(users: any[], subject: string, body: string): Promise<any> {
    sgMail.setApiKey(process.env.SEND_GRID_API_KEY);
    sgMail.setSubstitutionWrappers('{{', '}}'); // Configure the substitution tag wrappers globally
    const emails = [];
    for (const u of users) {
      let tempEmail = '';
      let tempFullName = '';
      let tempPhone = '';
      const data = {};
      if (u['Email'])
        tempEmail = u['Email'];
      data["{{email}}"] = tempEmail;

      if (u['FullName'])
        tempFullName = u['FullName'];
      data["{{full_name}}"] = tempFullName;

      if (u['Tel'])
        tempPhone = u['Tel'];
      data["{{phone}}"] = tempPhone;

      // replace key -> value
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const value = data[key];
          subject = subject.replace(new RegExp(key, "g"), value);
          body = body.replace(new RegExp(key, "g"), value);
        }
      }

      //for testing
      tempEmail = "tronguct@gmail.com";
      // tempFirstName = "<b>trong</b><ul><li>test 1</li><li>test 2</li></ul>";
      if (Utils.emailIsValid(tempEmail)) {
        emails.push({
          from: 'app@mcbooks.vn',
          templateId: process.env.SEND_GRID_COMMON_TEMPLATE_ID,
          personalizations: [
            {
              to: [{ email: tempEmail }],
              substitutions: {
                subject: subject,
                body: body
              }
            }
          ]
        });
      }
    }
    if (emails.length > 0) {
      const res = await sgMail.sendMultiple(emails);
      return res;
    } else {
      return null;
    }
  }

  async sendBulkSMSs(req, limit, offset, totalRecord): Promise<any> {
    var data = await this.getUsers(
      req.body.filter,
      req.body.orderby,
      limit,
      offset,
      -1,
      'notification');
    offset = data.next_offset;
    totalRecord = data.count;
    if (data.value.length > 0) {
      // for testing comment
      const result = await this.sendSMS(data.value, req.body.sms_content);
    }
    if (data.value.length === limit) {
      this.sendBulkSMSs(req, limit, offset, totalRecord);
    }
  }

  async sendSMS(users: any[], content: string): Promise<any> {
    let receivers = [];
    for (const u of users) {
      if (u['Tel']) {
        receivers.push({ "receiver": u['Tel'], "content": "" });
      }
    }

    //for testing
    receivers = [];
    receivers.push({ "receiver": '0363121271', "content": "" });

    const data = {
      "user": process.env.SMS_API_USER,
      "password": process.env.SMS_API_PASSWORD,
      "brandname": "MCBooks",
      "template": content,
      "request_id": "1111-2222-3333-4444",
      "activated_at": "",
      "data": receivers
    };

    const response = await serviceHelper.calAPISMS(data);

    console.log(response);

    // log info to database to use if need
    const db = await connect();
    return response;
  }

  async getUsers(
    filter: string,
    orderby: string,
    limit: number,
    offset: number,
    totalRecord: number,
    type: string): Promise<any> {
    try {
      console.log(filter);
      console.log(orderby);
      if (orderby && orderby.length > 0) {
        orderby = `u."${orderby[0]['field']}" ${orderby[0]['direction']}`;
      } else {
        orderby = 'u."Id" desc';
      }

      const db = await connect();
      let query = `select
                      u.*,
                      (
                        select
                          sum(o."Amount")
                        from
                          "Orders" o
                        where
                          o."UserId" = u."Id"
                          and o."Status" = 4
                          and (o."IsDeleted" <> true
                          or o."IsDeleted" is null)) "Revenue",
                      vg."Name" "VipGroupName",
                      m."FullName" "UserCareFullName",
                      d."Name" "DistrictName",
                      c."Name" "CityName"
                    from
                      "Users" u
                    left join "VipGroups" vg on
                      u."CurrentVipGroupId" = vg."Id"
                      and (vg."IsDeleted" <> true
                      or vg."IsDeleted" is null)
                    left join "Users" m on
                      u."UserCareId" = m."Id"
                      and (m."IsDeleted" <> true
                      or m."IsDeleted" is null)
                    left join v_district d on
                      u."DistrictId" = d."Id"
                    left join v_city c on
                      u."CityId" = c."Id"
                    where
                      u."Status" = 1
                      and u."UserType" = 2
                      and (u."IsDeleted" <> true
                      or u."IsDeleted" is null)`;
      var data = [];
      var nexDataIndex = 0;

      const conditions = [];
      if (filter['filters'] && filter['filters'].length > 0) {
        filter['filters'].forEach(element => {
          const field = element['field'];
          const search = element['search'];
          if (field === 'FullName' || field === 'Email' || field === 'Tel') {
            nexDataIndex++;
            data.push(search);
            conditions.push(`position($${nexDataIndex} in u."${field}") > 0`);
          } else if (field === "VipGroupIds") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`u."CurrentVipGroupId" = ANY($${nexDataIndex}::int[])`);
          } else if (field === "CityIds") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`u."CityId" = ANY($${nexDataIndex}::int[])`);
          } else if (field === "DistrictIds") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`u."DistrictId" = ANY($${nexDataIndex}::int[])`);
          } else if (field === "UserCareIds") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`u."UserCareId" = ANY($${nexDataIndex}::int[])`);
          } else if (field === "UserCareId") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`u."UserCareId" = $${nexDataIndex}`);
          } else if (field === "RegisterTimeMin") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`date(u."RegisterTime") >= date($${nexDataIndex})`);
          } else if (field === "RegisterTimeMax") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`date(u."RegisterTime") <= date($${nexDataIndex})`);
          }
        });
      }

      if (conditions.length > 0) {
        query += ` and ${conditions.join(' and ')}`
      }

      if (orderby) {
        query += ` ORDER BY ${orderby}`;
      }

      let queryCount = query.replace(`select
      u.*,
      (
        select
          sum(o."Amount")
        from
          "Orders" o
        where
          o."UserId" = u."Id"
          and o."Status" = 4
          and (o."IsDeleted" <> true
          or o."IsDeleted" is null)) "Revenue",
      vg."Name" "VipGroupName",
      m."FullName" "UserCareFullName",
      d."Name" "DistrictName",
      c."Name" "CityName"
    from`, 'select count(*) from');

      if (type == 'excel' && limit && limit > 0) {
        nexDataIndex++;
        data.push(limit);
        query += ' LIMIT $' + nexDataIndex;
        var { rows } = await db.query(query, data);
        var queryData = convertResults(rows);
        return queryData;
      } else if (limit) {
        // paging
        nexDataIndex++;
        data.push(offset);
        query += ' OFFSET $' + nexDataIndex;

        nexDataIndex++;
        data.push(limit);
        query += ' LIMIT $' + nexDataIndex;

        var countDataFilter = data.slice(0);
        //remove limit data
        countDataFilter.pop();
        //remove offset data
        countDataFilter.pop();

        console.log(queryCount);
        console.log(countDataFilter);
        console.log(query);
        console.log(data);

        const countRes = await db.query(queryCount, countDataFilter);

        const { rows } = await db.query(query, data);
        const queryData = convertResults(rows);

        return {
          count: countRes.rows[0].count,
          value: queryData,
          next_offset: (offset + limit),
        };
      }
    } catch (error) {
      console.log(error);
    }
  }
}