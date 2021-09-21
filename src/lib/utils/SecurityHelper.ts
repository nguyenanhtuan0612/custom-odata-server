import connect from "./connect"
var crypto = require('crypto');

export class SecurityHelper {

    static async CheckPrivilege_AdminOrder(role_id: any[]) {
        const IsInRole = role_id.some(x => x === UserRole.ADMIN_MANAGE_ORDER);
        if (IsInRole)
            return { "success": true, "message": "" };
        else
            return { "success": false, "message": "Not Allow" };
    }

    static async CheckPrivilegeFunction(user_id: number, role_id: number[], fName: string, params: Object): Promise<any> {
        switch (fName) {
            case 'Orders/Mcbook.addToCart':
                return await this.CheckPrivilege_F_AddToCart(user_id, params);
            case 'Orders/Mcbook.paymentForReservedOrder':
                return await this.CheckPrivilege_F_PaymentForReservedOrder(user_id, params);
            case 'Notifications/Mcbook.getNotification':
                return await this.CheckPrivilege_F_RelatedUser(user_id, params);
            case 'Orders/Mcbook.updateQuantityReservedBook':
                return await this.CheckPrivilege_F_UpdateQuantityReservedBook(user_id, params);
            case 'Orders/Mcbook.addBookToReserveOrder':
                return await this.CheckPrivilege_F_RelatedUser(user_id, params);
            case 'Users/Mcbook.updatePasswordForBackendUser':
                return await this.CheckPrivilege_F_RelatedUser(user_id, params);
            case 'Orders/Mcbook.getOrderSummary':
                const IsInRole = role_id.some(x => x === UserRole.ADMIN_REPORT);
                if (IsInRole)
                    return { "success": true, "message": "" };
                else
                    return { "success": false, "message": "Not Allow" };
            case 'Notifications/getNotificationCount':
                return await this.CheckPrivilege_F_RelatedUser(user_id, params);
            default:
                return { "success": true, "message": "" };
        }
    }

    static async CheckPrivilege_F_UpdateQuantityReservedBook(user_id: number, params: Object) {
        const f_order_id = await this.GetParamByName(params, "Key");
        const order = await this.GetEntityById(f_order_id, "Orders");
        if (order != null && Number(order.UserId) === user_id) {
            return { "success": true, "message": "" }
        } else {
            return { "success": false, "message": "Not Allow" }
        }
    }

    static async CheckPrivilege_F_RelatedUser(user_id: number, params: Object) {
        const f_userId = await this.GetParamByName(params, "UserId");
        if (f_userId != null && Number(f_userId) === user_id) {
            return { "success": true, "message": "" }
        } else {
            return { "success": false, "message": "Not Allow" }
        }
    }

    static async CheckPrivilege_F_PaymentForReservedOrder(user_id: number, params: Object) {
        const f_order_id = await this.GetParamByName(params, "OrderId");
        const order = await this.GetEntityById(f_order_id, "Orders");
        if (order != null && Number(order.UserId) === user_id) {
            return { "success": true, "message": "" }
        } else {
            return { "success": false, "message": "Not Allow" }
        }
    }


    static async CheckPrivilege_F_AddToCart(user_id: number, params: Object) {
        const f_user_id = await this.GetParamByName(params, "UserId");
        if (Number(f_user_id) === user_id) {
            return { "success": true, "message": "" }
        } else {
            return { "success": false, "message": "Not Allow" }
        }
    }

    static async GetParamByName(arrParams: Object, paramName: string): Promise<any> {

        var cArrParams = arrParams as any[];
        for (var item of cArrParams) {
            if (item["key"] == paramName) {
                return item["value"];
            }
        }
        return null;
    }

    static async CheckPrivilige(user_id: number, role_id: number[], method: string, cotrollerName: string, data: JSON, id: number): Promise<any> {
        console.log(cotrollerName)
        switch (cotrollerName) {
            case 'Authors':
                if (method === "GET") {
                    return { "success": true, "message": "" };
                } else {
                    return await this.AdministratorOnly(role_id);
                }
            case 'BookAuthors':
                return await this.CheckPrivilige_AdminManageBook(user_id, role_id, method);
            case 'BookCategories':
                return await this.CheckPrivilige_AdminManageBook(user_id, role_id, method);
            case 'Books':
                return await this.CheckPrivilige_AdminManageBook(user_id, role_id, method);
            case 'Categories':
                return await this.CheckPrivilige_AdminManageBook(user_id, role_id, method);
            case 'GHTK_LOGS':
                return await this.ReadOnly(method);
            case 'GHTK_STATUS':
                return await this.ReadOnly(method);
            case 'Notifications':
                return await this.CheckPrivilige_Notifications(user_id, role_id, method);
            case 'Orders':
                return await this.CheckPrivilige_ManageOrder(user_id, role_id, method, data, id);
            case 'OrderDetails':
                return await this.CheckPrivilige_ManageOrderDetail(user_id, role_id, method, data, id);
            case 'ReserveBooks':
                return await this.CheckPrivilige_ReserveBook(user_id, role_id, method, data, id);
            case 'UserNotifcations':
                return await this.CheckPrivilige_UserNotification(user_id, role_id, method, data);
            case 'UserRoles':
                return await this.CheckPrivilige_UserRoles(user_id, role_id, method);
            case 'UserVipGroups':
                return await this.CheckPrivilige_UserVipGroups(user_id, role_id, method, id);
            case 'Users':
                return await this.CheckPrivilige_Users(user_id, role_id, method, id);
            case 'VipGroups':
                return await this.CheckPrivilige_VipGroups(user_id, role_id, method);
            case 'SystemSettings':
                if (method === "GET") {
                    return { "success": true, "message": "" };
                } else {
                    return await this.AdministratorOnly(role_id);
                }
            case 'Slides':
                if (method === "GET") {
                    return { "success": true, "message": "" };
                } else {
                    return await this.AdministratorOnly(role_id);
                }
            case 'TransactionHistories':
                return await this.ReadOnly(method);
            default:
                return { "success": true, "message": "" };
        }
    }

    static async AdministratorOnly(role_id) {
        if (role_id.length > 0) {
            return { "success": true, "message": "" };
        } else {
            return { "success": false, "message": "Not Allow" };
        }
    }

    static async ReadOnly(method) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        } else {
            return { "success": false, "message": "Cannot access." };
        }
    }

    static async CheckPrivilige_Users(user_id: number, role_id: number[], method, id: number) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        } else {

            if (user_id == id) {
                return { "success": true, "message": "" };
            }

            const IsInRole = role_id.some(x => x === UserRole.ADMIN_MANAGE_VIP || x === UserRole.ADMIN_PERMISSION);
            if (IsInRole)
                return { "success": true, "message": "" };

            const IsInRoleOrderVip = role_id.some(x => x === UserRole.ADMIN_MANAGE_ORDER_VIP);
            const user = await this.GetEntityById(id, "Users");

            if (user != null && IsInRoleOrderVip && user.UserCareId === user_id) {
                return { "success": true, "message": "" };
            } else {
                return { "success": false, "message": "Cannot Access" };
            }
        }
    }

    static async CheckPrivilige_UserVipGroups(user_id: number, role_id: number[], method: string, id: number) {

        if (method === "GET") {
            return { "success": true, "message": "" };
        } else {

            const IsInRole = role_id.some(x => x === UserRole.ADMIN_MANAGE_VIP);
            if (IsInRole)
                return { "success": true, "message": "" };

            const IsInRoleOrderVip = role_id.some(x => x === UserRole.ADMIN_MANAGE_ORDER_VIP);
            const userId = await this.GetEntityById(id, "UserVipGroups");
            const user = await this.GetEntityById(userId.Id, "Users");

            if (user != null && IsInRoleOrderVip && user.rows[0].UserCareId === user_id) {
                return { "success": true, "message": "" };
            } else {
                return { "success": false, "message": "Cannot Access" };
            }
        }
    }

    static async CheckPrivilige_VipGroups(user_id: number, role_id: number[], method: string) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        } else {
            const IsInRole = role_id.some(x => x === UserRole.ADMIN_MANAGE_VIPGROUP);
            if (IsInRole)
                return { "success": true, "message": "" };
            else
                return { "success": false, "message": "Cannot access." };
        }
    }

    static async CheckPrivilige_Notifications(user_id: number, role_id: number[], method: string) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        } else {
            const IsInRole = role_id.some(x => x === UserRole.ADMIN_NOTIFICATION);
            if (IsInRole)
                return { "success": true, "message": "" };
            else
                return { "success": false, "message": "Cannot access." };
        }
    }

    static async CheckPrivilige_UserRoles(user_id: number, role_id: number[], method: any) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }

        const IsInRole = role_id.some(x => x === UserRole.ADMIN_PERMISSION);
        if (IsInRole)
            return { "success": true, "message": "" };
        else
            return { "success": false, "message": "Cannot access." };
    }

    static async CheckPrivilige_UserNotification(user_id: number, role_id: number[], method: string, data: any) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }

        if (method === "POST" && (data.MarkRead) && (data.UserId === user_id)) {
            return { "success": true, "message": "" };
        }

        if (method === "PATCH" && (data.MarkRead) && (data.UserId === user_id)) {
            return { "success": true, "message": "" };
        }

        const IsInRole = role_id.some(x => x === UserRole.ADMIN_NOTIFICATION);
        if (IsInRole)
            return { "success": true, "message": "" };
        else
            return { "success": false, "message": "Cannot access." };
    }

    static async CheckPrivilige_ReserveBook(user_id: number, role_id: number[], method: string, data: any, id: any) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }

        if (method === "POST") {
            if ((user_id === data["UserId"])) {
                return { "success": true, "message": "" };
            } else {
                return { "success": false, "message": "Not Allow." };
            }
        }

        if (method === "PUT" || method === "PATCH") {
            var entity = await this.GetEntityById(id, "ReserveBooks");
            if ((user_id === entity["UserId"])) {
                return { "success": true, "message": "" };
            } else {
                return { "success": false, "message": "Not Allow." };
            }
        }
        return { "success": false, "message": "Not Allow." };
    }

    static async CheckPrivilige_ManageOrderDetail(user_id: number, role_id: number[], method: string, data: any, id: any) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }

        if (method === "POST")
            return { "success": false, "message": "Method not allow" };

        var entity = await this.GetEntityById(id, "OrderDetails");
        var orderEntity = await this.GetEntityById(entity["OrderId"], "Orders");
        if (user_id !== orderEntity["UserId"])
            return { "success": false, "message": "Not allow" };
        else {
            return { "success": true, "message": "" };
        }
    }

    static async CheckPrivilige_ManageOrder(user_id: number, role_id: number[], method: string, data: any, id: any) {
        if (method === "GET") {
            if (isNaN(id) === true) {
                return { "success": true, "message": "" };
            }

            if (id) {
                var entity = await this.GetEntityById(id, "Orders");
                if (entity == null) {
                    return { "success": true, "message": "" };
                }
                if (user_id === entity["UserId"]) {
                    return { "success": true, "message": "" };
                }
            }

            const IsInRole = role_id.some(x => (x === UserRole.ADMIN_MANAGE_ORDER || x === UserRole.ADMIN_MANAGE_VIP));
            console.log(IsInRole)
            if (IsInRole)
                return { "success": true, "message": "" };
            else
                return { "success": false, "message": "Cannot access." };
        }

        if (method === "POST") {
            if (user_id != data["UserId"]) {
                return { "success": false, "message": "Not allow create Order for othes member" };
            } else {
                return { "success": true, "message": "" };
            }
        }
        else {

            if (method === "DELETE") {
                return { "success": false, "message": "Not allow delete Order" };
            }

            if (method === "PATCH" || method === "PUT") {
                const order = await this.GetEntityById(id, "Orders");
                if (user_id === order.UserId && (data.Status === 1 || data.Status === 7 || data.Status === -2)) {
                    return { "success": true, "message": "" }
                }

                const orderUser = await this.GetEntityById(order.UserId, "Users");
                if (orderUser && (orderUser.UserCareId === user_id)) {
                    return { "success": true, "message": "" }
                }
            }

            const IsInRole = role_id.some(x => x === UserRole.ADMIN_MANAGE_ORDER);
            console.log(IsInRole)
            if (IsInRole)
                return { "success": true, "message": "" };
            else
                return { "success": false, "message": "Cannot access." };
        }
    }

    static async CheckPrivilige_AdminManageBook(user_id: number, role_id: number[], method: string) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id && role_id) {
            const IsInRole = role_id.some(x => x === UserRole.ADMIN_MANAGE_BOOK);
            if (IsInRole)
                return { "success": true, "message": "" };
            else
                return { "success": false, "message": "Cannot access." };
        }
        else
            return { "success": false, "message": "Cannot indetify the user or cant't access" };
    }

    static async GetEntityById(id: number, tableName: string): Promise<any> {
        const db = await connect();
        var queryResult = await db.query('Select * from "' + tableName + '" where "Id" =$1', [id]);
        if (queryResult.rows.length > 0)
            return queryResult.rows[0];
        else
            return null;
    }
    static async Login(email: string, password: string): Promise<any> {
        const db = await connect();
        var queryResult = await db.query('Select * from "Users" where "Email"=$1 and ("IsDeleted" = false or "IsDeleted" is null)', [email]);
        if (queryResult.rows.length > 0) {
            var hash = crypto.createHash("sha256")
                .update(password)
                .digest("hex");
            if (queryResult.rows[0]["Password"] == hash) {
                queryResult.rows[0]["IsMissedInfomation"] = queryResult.rows[0].FullName == null || queryResult.rows[0].Tel == null || queryResult.rows[0].Email == null || queryResult.rows[0].CityId == null || queryResult.rows[0].DistrictId == null || queryResult.rows[0].Address == null;
                return queryResult.rows[0];
            }
            else
                return null;
        }
        else {
            return null;
        }
    }

    static async GetRoleId(userId: number): Promise<any> {
        const db = await connect();
        var roleRes = await db.query(`select * from "UserRoles" where "UserId" = $1`, [userId]);
        if (roleRes.rows.length > 0) {

            const roleIds = [];
            for (let index = 0; index < roleRes.rows.length; index++) {
                const item = roleRes.rows[index];
                roleIds.push(item.RoleId);
            }
            return roleIds;

        } else return [];
    }

}

export class UserRole {
    static readonly ADMIN_PERMISSION = 1;
    static readonly ADMIN_MANAGE_BOOK = 2;
    static readonly ADMIN_MANAGE_VIPGROUP = 3;
    static readonly ADMIN_MANAGE_VIP = 4;
    static readonly ADMIN_CARE_VIP = 5;
    static readonly ADMIN_MANAGE_ORDER = 6;
    static readonly ADMIN_MANAGE_ORDER_VIP = 7;
    static readonly ADMIN_REPORT = 8;
    static readonly ADMIN_NOTIFICATION = 9;
    // static readonly ADMIN_FULL_ACCESS = 10000;
}