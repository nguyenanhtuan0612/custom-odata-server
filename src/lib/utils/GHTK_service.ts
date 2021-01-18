import connect from "../utils/connect";
import insert from "../utils/insert";
import update from "../utils/update";
import { GHTK_CallbackInfo } from "../utils/GHTK_CallbackInfo"
import { ServiceHelper } from "./service";
const config = require('./../config');
const serviceHelper = new ServiceHelper();
export class GHTK_service {

    async GetFee(orderId: number = 0): Promise<any[]> {
        const db = await connect();

        var rs = await db.query(' select * from v_orderfee where "OrderId" =$1', [orderId]);
        if (rs.rows.length <= 0) {
            var Errordata =
            {
                "success": false,
                "OrderId": orderId,
                "message": "Not found Address or Order",
                "FeeStr": -1,

            };
            return [Errordata];
        }
        var url = config.GHTK_URL + config.GHTK_FEE_PATH;
        url += '?address=' + rs.rows[0]["address"];
        url += '&province=' + rs.rows[0]["city"];
        url += '&district=' + rs.rows[0]["district"];
        url += '&pick_province=' + config.GHTK_PICK_CITY;
        url += '&pick_district=' + config.GHTK_PICK_DISTRICT;
        url += '&pick_address=' + config.GHTK_PICK_ADDRESS;
        url += '&weight=' + rs.rows[0]["totalweight"] * 1000;
        url += '&value=' + rs.rows[0]["TotalAmount"];
        url = encodeURI(url);

        var data = await serviceHelper.calAPI(url, 'GET', null, config.GHTK_Token);
        var logdata = {
            "success": data.success,
            "OrderId": orderId,
            "message": data.message,
            "FeeStr": data.fee,
            "ActionType": config.GHTK_PICK_ACIONTYPE_FEE,
            "Created_at": new Date()
        }
        const insertResult = await insert(db, "GHTK_LOGS", [logdata]);
        return data;
    }

    // async GetFeeWithDefaultAddress(orderId: number = 0): Promise<any[]> {
    //     const db = await connect();

    //     var rs = await db.query(' select * from v_orderfee_chosen where "OrderId" =$1', [orderId]);
    //     if (rs.rows.length <= 0) {
    //         var Errordata =
    //         {
    //             "success": false,
    //             "OrderId": orderId,
    //             "message": "Not found Address or Order",
    //             "FeeStr": -1,

    //         };
    //         return [Errordata];
    //     }
    //     var url = config.GHTK_URL + config.GHTK_FEE_PATH;
    //     url += '?address=' + rs.rows[0]["d_Address"];
    //     url += '&province=' + rs.rows[0]["d_City"];
    //     url += '&district=' + rs.rows[0]["d_District"];
    //     url += '&pick_province=' + config.GHTK_PICK_CITY;
    //     url += '&pick_district=' + config.GHTK_PICK_DISTRICT;
    //     url += '&pick_address=' + config.GHTK_PICK_ADDRESS;
    //     url += '&weight=' + rs.rows[0]["totalweight"] * 1000;
    //     url += '&value=' + rs.rows[0]["TotalAmount"];
    //     url = encodeURI(url);

    //     var data = await serviceHelper.calAPI(url, 'GET', config.GHTK_Token, null);
    //     var logdata = {
    //         "success": data.success,
    //         "OrderId": orderId,
    //         "message": data.message,
    //         "FeeStr": data.fee,
    //         "ActionType": config.GHTK_PICK_ACIONTYPE_FEE,
    //         "Created_at": new Date()
    //     }
    //     const insertResult = await insert(db, "GHTK_LOGS", [logdata]);

    //     let fee = data.fee.fee;
    //     if (rs.rows[0]["IsFreeShip"] == true) {
    //         fee = 0;
    //     }
    //     var orderData = {
    //         "ShipAmount": parseInt(fee),
    //         "ShipAmountGHTK": parseInt(data.fee.fee),
    //         "DeliveryAddress": `${rs.rows[0]["d_Address"]}, ${rs.rows[0]["d_District"]}, ${rs.rows[0]["d_City"]}`,
    //         "DeliveryContacName": rs.rows[0]["ContactName"],
    //         "DeliveryPhone": rs.rows[0]["ContactTel"]
    //     };
    //     const updateOrder = await update(db, "Orders", orderId, orderData);

    //     return data;
    // }
    async PostOrder(orderId: number = 0): Promise<any> {
        var url = config.GHTK_URL + config.GHTK_POSTORDER_PATH;
        const db = await connect();
        var rs = await db.query(' select * from v_orderfee where "OrderId" =$1', [orderId]);
        var pick_money = 0;
        var is_feeship = '1'

        var order = {
            "id": orderId,
            "pick_name": config.GHTK_PICK_NAME,
            "pick_address": config.GHTK_PICK_ADDRESS,
            "pick_province": config.GHTK_PICK_CITY,
            "pick_district": config.GHTK_PICK_DISTRICT,
            "pick_tel": config.GHTK_PICK_TEL,
            "tel": rs.rows[0]["Tel"],
            "name": rs.rows[0]["FullName"],
            "address": rs.rows[0]["address"],
            "province": rs.rows[0]["city"],
            "district": rs.rows[0]["district"],
            "is_freeship": is_feeship,
            "pick_money": pick_money,
            "value": rs.rows[0]["TotalAmount"]

        }
        var products = [];
        var rs1 = await db.query(' select * from v_orderproducts where "OrderId" =$1', [orderId]);
        for (var item of rs1.rows) {
            products.push(
                {
                    "name": item["Name"],
                    "weight": item["TotalWeight"],
                    "quantity": item["TotalCount"]
                }
            );
        }
        var json = {
            "products": products,
            "order": order
        };
        var data = await serviceHelper.calAPI(url, 'POST', json, config.GHTK_Token);
        if (data.success) {
            var logdata = {
                "success": data.success,
                "OrderId": orderId,
                "message": data.message,
                "label_id": data.order.label,
                "fee": data.order.fee,
                "insurance_fee": data.order.insurance_fee,
                "estimated_pick_time": data.order.estimated_pick_time,
                "estimated_deliver_time": data.order.estimated_deliver_time,
                "ActionType": config.GHTK_PICK_ACIONTYPE_POSTORDER,
                "OrderStr": data.order,
                "Created_at": new Date()
            }
            const insertResult = await insert(db, "GHTK_LOGS", [logdata]);
        }
        else {
            if (data.error) {
                var logdata_withError = {
                    "success": data.success,
                    "OrderId": orderId,
                    "message": data.message,
                    "ErrorStr": data.error,
                    "ActionType": config.GHTK_PICK_ACIONTYPE_POSTORDER,
                    "Created_at": new Date()
                }
                const insertResult = await insert(db, "GHTK_LOGS", [logdata_withError]);
            }
            else {
                var logdata_withoutError = {
                    "success": data.success,
                    "OrderId": orderId,
                    "message": data.message,
                    "ActionType": config.GHTK_PICK_ACIONTYPE_POSTORDER,
                    "Created_at": new Date()
                }
                const insertResult = await insert(db, "GHTK_LOGS", [logdata_withoutError]);
            }

        }
        return data;
    }
    async GetStatus(orderId: number = 0): Promise<any> {
        const db = await connect();

        var rs = await db.query(' select * from "GHTK_LOGS" where "OrderId" =$1 and "success"=true and "ActionType"=1', [orderId]);
        if (rs.rows.length <= 0) {
            return { "success": false, "message": config.GHTK_ERRROR_ORDER_NOT_POST };
        }
        var url = config.GHTK_URL + config.GHTK_STATUS_PATH;
        url += '/' + rs.rows[0]["label_id"];

        var data = await serviceHelper.calAPI(url, 'GET', null, config.GHTK_Token);
        if (!data.success) {
            var errorLog = {
                "success": data.success,
                "message": data.message,
                "OrderId": orderId,
                "ActionType": config.GHTK_PICK_ACIONTYPE_STATUS,
                "Created_at": new Date()
            }
            await insert(db, "GHTK_LOGS", [errorLog]);
        }
        else {
            var logdata = {
                "success": data.success,
                "OrderId": orderId,
                "message": data.message,
                "OrderStr": data.order,
                "status": data.order.status,
                "status_text": data.order.status_text,
                "ActionType": config.GHTK_PICK_ACIONTYPE_STATUS,
                "Created_at": new Date()
            }

            const insertResult = await insert(db, "GHTK_LOGS", [logdata]);
            this.UpdateOrderDeliverStatus(orderId, Number(data.order.status), Number(data.order.shipMoney));
        }

        return data;
    }
    async Cancel(orderId: number = 0): Promise<any> {
        const db = await connect();

        var rs = await db.query(' select * from "GHTK_LOGS" where "OrderId" =$1 and "success"=true and "ActionType"=1', [orderId]);
        if (rs.rows.length <= 0) {
            return { "success": false, "message": config.GHTK_ERRROR_ORDER_NOT_POST };
        }
        var url = config.GHTK_URL + config.GHTK_CANCEL;
        url += '/' + rs.rows[0]["label_id"];

        var data = await serviceHelper.calAPI(url, 'POST', null, config.GHTK_Token);
        if (!data.success) {
            var errorLog = {
                "success": data.success,
                "message": data.message,
                "OrderId": orderId,
                "ActionType": config.GHTK_PICK_ACIONTYPE_CANCEL,
                "Created_at": new Date()
            }
            await insert(db, "GHTK_LOGS", [errorLog]);
        }
        else {
            var logdata = {
                "success": data.success,
                "OrderId": orderId,
                "message": data.message,
                "status": -1,
                "ActionType": config.GHTK_PICK_ACIONTYPE_CANCEL,
                "Created_at": new Date()
            }
            const insertResult = await insert(db, "GHTK_LOGS", [logdata]);
            this.UpdateOrderDeliverStatus(orderId, -1);
        }

        return data;
    }
    async GHTK_CallBack(data: GHTK_CallbackInfo): Promise<any> {
        const db = await connect();
        var logdata = {
            "success": true,
            "status": data.status_id,
            "OrderId": data.partner_id,
            "label_id": data.label_id,
            "action_time": data.action_time,
            "reason_code": data.reason_code,
            "reason": data.reason,
            "weight": data.weight,
            "fee": data.fee,
            "pick_money": data.pick_money,
            "ActionType": config.GHTK_PICK_ACIONTYPE_RECEIVE,
            "Created_at": new Date()
        }
        //           
        const insertResult = await insert(db, "GHTK_LOGS", [logdata]);
        this.UpdateOrderDeliverStatus(Number(data.partner_id), Number(data.status_id));
        return { "success": true };
    }

    async UpdateOrderDeliverStatus(orderId: number, status: number, shipMoney: number = 0): Promise<any> {
        var orderStatus = -1;
        switch (status) {
            case 2:
                orderStatus = 3;
                console.log(orderStatus);
                break;
            case 3:
                orderStatus = 3;
                break;
            case 4:
                orderStatus = 3;
                break;
            case 8:
                orderStatus = 3;
                break;
            case 10:
                orderStatus = 3;
                break;
            case 12:
                orderStatus = 3;
                break;
            case 20:
                orderStatus = 3;
                break;
            case 123:
                orderStatus = 3;
                break;
            case 128:
                orderStatus = 3;
                break;
            case 5:
                orderStatus = 4;
                break;
            case 6:
                orderStatus = 4;
                break;
            case 21:
                orderStatus = 4;
                break;
            case 6:
                orderStatus = 4;
                break;
            case 45:
                orderStatus = 4;
                break;
            case 7:
                orderStatus = 6;
                break;
            case 9:
                orderStatus = 6;
                break;
            case 13:
                orderStatus = 6;
                break;
            case 49:
                orderStatus = 6;
                break;
            case -1:
                orderStatus = 7;
                break;
            default:
                orderStatus = -1;
                break;
        }
        const db = await connect();
        var dataOrderUpdate = { "Status": orderStatus, "UpdatedAt": new Date() }
        if (shipMoney > 0) {
            dataOrderUpdate["ShipAmountGHTK"] = shipMoney;
        }
        var queryResult = await update(db, "Orders", orderId, dataOrderUpdate);
        const token = await serviceHelper.getAccessToken();
        serviceHelper.calAPI(`${config.ODATA_URL}/Orders(${orderId})`, "PATCH", dataOrderUpdate, token);
        this.InsertOrderState(orderId, status);
        return queryResult.rows.length;
    }

    async InsertOrderState(orderId: number, status: number): Promise<any> {
        const db = await connect();
        const isExistRecord = await db.query(`select * from "OrderStates" where "OrderId" = $1 and "ResultStatus" = $2`, [orderId, status]);
        if (isExistRecord.rows.length > 0) {
            return 0;
        }
        
        let descriptionText = 'GHTK ';
        const statusDescriptionRes = await db.query(`select * from "GHTK_STATUS" where "Status" = $1`, [status]);
        if (statusDescriptionRes.rows.length > 0) {
            descriptionText += statusDescriptionRes.rows[0].Status_text;
        }
        const insertResult = await insert(db, "OrderStates", [{ "OrderId": orderId, "ResultStatus": status, "State": 10, "StateDescription": descriptionText, "FinishTime": new Date(), "CreatedOn": new Date() }]);
        return insertResult.rows.length;
    }

}