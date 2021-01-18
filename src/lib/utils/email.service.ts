import { Constants } from "../utils/constants";
import connect from "../utils/connect";
import convertResults from "../utils/convertResults";
import { Utils } from "../utils/utils";
import { ServiceHelper } from './service';
import { SecurityHelper } from '../utils/SecurityHelper';

const sgMail = require('@sendgrid/mail');
const sgClient = require('@sendgrid/client');
const serviceHelper = new ServiceHelper();
const securityHelper = new SecurityHelper();
const config = require('./../config');
export class EmailService {
    async sendEmail(reqBody): Promise<any> {
        try {
            const db = await connect();
            var emailTemplate;

            const { rows } = await db.query('select "Subject","Body" from "EmailTemplates" where "Name" = $1 limit 1;', [reqBody.TemplateId]);
            const data = convertResults(rows);
            if (data.length > 0) {
                emailTemplate = data[0];
            } else {
                throw Error(`Không tìm thấy EmailTemplates '${reqBody.Name}'`);
            }

            if (reqBody.Data && reqBody.Data.length > 0) {
                reqBody.Data.forEach(keyValue => {
                    const key = keyValue[0];
                    const value = keyValue[1];
                    emailTemplate["Subject"] = emailTemplate["Subject"].replace(new RegExp(Utils.escapeRegExp(key), "g"), value);
                    emailTemplate["Body"] = emailTemplate["Body"].replace(new RegExp(Utils.escapeRegExp(key), "g"), value);
                });
            }

            const emails = [];
            if (reqBody.Emails && reqBody.Emails.length > 0) {
                for (const u of reqBody.Emails) {
                    let tempEmail = '';

                    if (u)
                        tempEmail = u;

                    emails.push({
                        from: 'app@mcbooks.vn',
                        templateId: process.env.SEND_GRID_COMMON_TEMPLATE_ID,
                        personalizations: [
                            {
                                to: [{ email: tempEmail }],
                                substitutions: {
                                    subject: emailTemplate["Subject"],
                                    body: emailTemplate["Body"]
                                }
                            }
                        ]
                    });
                }
            }

            sgMail.setApiKey(process.env.SEND_GRID_API_KEY);
            sgMail.setSubstitutionWrappers('{{', '}}'); // Configure the substitution tag wrappers globally

            sgMail.sendMultiple(emails);
        } catch (error) {
            console.log(error);
        }
    }

    async sendMultipleEmails(reqBody): Promise<any> {
        try {
            const db = await connect();
            var emailTemplate;

            const { rows } = await db.query('select "Subject","Body" from "EmailTemplates" where "Name" = $1 limit 1;', [reqBody.TemplateId]);
            const data = convertResults(rows);
            if (data.length > 0) {
                emailTemplate = data[0];
            } else {
                throw Error(`Không tìm thấy EmailTemplates '${reqBody.Name}'`);
            }
            const emails = [];
            if (reqBody.Emails && reqBody.Emails.length > 0) {
                reqBody.Emails.forEach(emailData => {
                    if (emailData.Data && emailData.Data.length > 0) {

                        // Replate data
                        var emailSubject = emailTemplate["Subject"];
                        var emailBody = emailTemplate["Body"];
                        emailData.Data.forEach(keyValue => {
                            const key = keyValue[0];
                            const value = keyValue[1];
                            emailSubject = emailSubject.replace(new RegExp(Utils.escapeRegExp(key), "g"), value);
                            emailBody = emailBody.replace(new RegExp(Utils.escapeRegExp(key), "g"), value);
                        });

                        emails.push({
                            from: 'app@mcbooks.vn',
                            templateId: process.env.SEND_GRID_COMMON_TEMPLATE_ID,
                            personalizations: [
                                {
                                    to: [{ email: emailData.Email }],
                                    substitutions: {
                                        subject: emailSubject,
                                        body: emailBody
                                    }
                                }
                            ]
                        });
                    }
                });
            }

            sgMail.setApiKey(process.env.SEND_GRID_API_KEY);
            sgMail.setSubstitutionWrappers('{{', '}}'); // Configure the substitution tag wrappers globally
            sgMail.sendMultiple(emails);
        } catch (error) {
            console.log(error);
        }
    }

    async notifyRecharge(userId: number, urlImg: string, vipId: number): Promise<any> {

        const db = await connect();

        const curUser = await db.query(`select curUser."FullName", curUser."Code", curUser."Id", careUser."Email" from "Users" curUser
        join "Users" careUser on curUser."UserCareId" = careUser."Id"
        where curUser."Id" = $1`, [userId]);

        const curVip = await db.query(`select * from "VipGroups" where "Id" = $1`, [vipId])

        if (curUser.rows.length > 0 && (curUser.rows[0].Email)) {

            const bodyEmail = {
                "TemplateId": "CONFIRM_IMAGE_RECHARGE",
                "Data": [
                    ["##FullName##", curUser.rows[0].FullName],
                    ["##UserCode##", curUser.rows[0].Code],
                    ["##UrlImg##", urlImg],
                    ["##VipName##", curVip.rows[0].Name]
                ],
                "Emails": [curUser.rows[0].Email]
            }

            await this.sendEmail(bodyEmail);

            // create temp user vip group
            const tempBody = {
                "IsApproved": false,
                "UserId": curUser.rows[0].Id,
                "VipGroupId": vipId,
                "CreatedAt": new Date(),
                "Amount": curVip.rows[0].Amount,
                "File1Url": urlImg,
            }

            // const bodyLogin = {
            //     "email": process.env.ADMIN_USERNAME,
            //     "password": process.env.ADMIN_PASSWORD
            // }

            // const login = await serviceHelper.calAPI(`${config.ODATA_URL}/login`, "POST", bodyLogin);
            // if (login.success && (login.token)) {
            serviceHelper.calAPI(`${config.ODATA_URL}/UserVipGroups`, "POST", tempBody, null);
            // }

            return { "success": true, "message": "Gửi xác minh thành công." }
        } else {
            return { "success": false, "message": "Đã có lỗi xảy ra. Vui lòng thử lại sau." }
        }

    }
}