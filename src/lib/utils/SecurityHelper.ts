import connect from "./connect"
export class SecurityHelper {
    static async CheckPrivilegeFunction(user_id: string, fName: string, params: Object): Promise<any> {
        switch (fName) {
            case 'BookEvaluates/Mcbook.removeConversation':
                return await this.Check_F_RemoveConversation(user_id, params);
            case 'Books/Mcbook.searchBoughtBookByMemberId':
                return await this.Check_F_BookOnwer(user_id, params);
            case 'Books/Mcbook.searchBookLikeOrPreviewByMemberId':
                return await this.Check_F_BookOnwer(user_id, params);
            case 'Books/Mcbook.searchBookReservesByMemberId':
                return await this.Check_F_BookOnwer(user_id, params);
            case 'MemberActions/Mcbook.PreviewFunction':
                return await this.Check_F_MemberAction(user_id, params);
            case 'MemberActions/Mcbook.LikeFunction':
                return await this.Check_F_MemberAction(user_id, params);
            case 'MemberDeliveryInfos/Mcbook.updateMemberDeliveryInfos':
                return await this.Check_F_MemberDeliveryInfo(user_id, params);
            case 'Orders/Mcbook.addToCart':
                return await this.Check_F_OrderAddToCart(user_id, params);
            case 'Orders/Mcbook.applyPromotionCode':
                return await this.Check_F_OrderOwner(user_id, params);
            case 'Orders/Mcbook.removePromotionCode':
                return await this.Check_F_OrderOwner(user_id, params);
            case 'Orders/Mcbook.applyMCCoinPay':
                return await this.Check_F_OrderOwner(user_id, params);
            case 'Orders/Mcbook.getOrderSummary':
                return await this.Check_F_OrderSummary(user_id, params);
            case 'PartnerBooks/Mcbook.saleAllBookForPartners':
                return await this.Check_F_PartnerBook(user_id, params);
            case 'PartnerBooks/Mcbook.copyRelatedCategoriesAndAuthors':
                return await this.Check_F_PartnerBook(user_id, params);
            case 'PartnerBooks/Mcbook.unSaleAllBookForPartners':
                return await this.Check_F_PartnerBook(user_id, params);
            case 'PartnerPromotionsC/Mcbook.delete':
                return await this.Check_F_PartnerBook(user_id, params);
            case 'PartnerPromotionsC/Mcbook.deactive':
                return await this.Check_F_PartnerBook(user_id, params);
            default:
                return { "success": true, "message": "" };
        }
    }

    static async Check_F_PartnerPromotion(user_id: string, arrParams) {
        var memberInfo = await this.GetMemberInfo(user_id);
        if (memberInfo && (memberInfo["PartnerId"] == 1)) {
            return { "success": true, "message": "" };
        }
        else
            return { "success": false, "message": "Not allow" };
    }

    static async Check_F_PartnerBook(user_id: string, arrParams) {
        var partnerId = await this.GetParamByName(arrParams, "partnerId");

        var memberInfo = await this.GetMemberInfo(user_id);
        if (memberInfo && (memberInfo["PartnerId"] == 1)) {
            return { "success": false, "message": "Not allow" };
        }
        else if (memberInfo && memberInfo["PartnerId"] === Number(partnerId)) {
            return { "success": true, "message": "" };
        }
        else
            return { "success": false, "message": "Not allow" };
    }

    static async Check_F_OrderSummary(user_id: string, arrParams) {
        var partnerId = await this.GetParamByName(arrParams, "partnerId");
        var partner = await this.GetEntityById(Number(partnerId), "Partners");

        var memberInfo = await this.GetMemberInfo(user_id);
        if (memberInfo && (memberInfo["PartnerId"] == 1))
            return { "success": true, "message": "" };
        else if (memberInfo && (memberInfo["PartnerId"] == partner["ParentId"] || memberInfo["PartnerId"] == partner["Id"])) {
            return { "success": true, "message": "" };
        }
        else
            return { "success": false, "message": "Not allow" };
    }

    static async Check_F_OrderAddToCart(user_id: string, arrParams) {
        var memberId = await this.GetParamByName(arrParams, "MemberId");
        var sessionId = await this.GetParamByName(arrParams, "sessionId");

        if (sessionId) {
            return { "success": true, "message": "" };
        }

        var memberInfo = await this.GetMemberInfo(user_id);
        if (memberInfo && (memberInfo["Id"] === Number(memberId)))
            return { "success": true, "message": "" };
        else
            return { "success": false, "message": "Not allow" };
    }

    static async Check_F_OrderOwner(user_id: string, arrParams) {
        var orderId = await this.GetParamByName(arrParams, "orderId");
        var order = await this.GetEntityById(Number(orderId), "Orders");

        if (order["SessionId"]) {
            return { "success": true, "message": "" };
        }

        var memberInfo = await this.GetMemberInfo(user_id);

        if (memberInfo &&
            (memberInfo["Id"] == order["MemberId"]))
            return { "success": true, "message": "" };
        else
            return { "success": false, "message": "Not allow" };
    }
    static async Check_F_MemberDeliveryInfo(user_id: string, arrParams) {
        var orderId = await this.GetParamByName(arrParams, "orderId");
        var chosenId = await this.GetParamByName(arrParams, "chosenId");
        var notChosenId = await this.GetParamByName(arrParams, "notChosenId");

        var order = await this.GetEntityById(Number(orderId), "Orders");
        var chosen = await this.GetEntityById(Number(chosenId), "MemberDeliveryInfos");
        var notChosen = await this.GetEntityById(Number(notChosenId), "MemberDeliveryInfos");
        var memberInfo = await this.GetMemberInfo(user_id);

        if (memberInfo &&
            (memberInfo["Id"] == order["MemberId"] && memberInfo["Id"] == chosen["MemberId"] && memberInfo["Id"] == notChosen["MemberId"]))
            return { "success": true, "message": "" };
        else
            return { "success": false, "message": "Not allow" };
    }
    static async Check_F_MemberAction(user_id: string, arrParams) {
        var paramValue = await this.GetParamByName(arrParams, "MemberId");
        var memberInfo = await this.GetMemberInfo(user_id);
        if (memberInfo && memberInfo["Id"] == Number(paramValue))
            return { "success": true, "message": "" };
        else
            return { "success": false, "message": "Not allow" };
    }
    static async Check_F_BookOnwer(user_id: string, arrParams) {
        var paramValue = await this.GetParamByName(arrParams, "MemberId");
        var memberInfo = await this.GetMemberInfo(user_id);
        if (memberInfo && memberInfo["Id"] == Number(paramValue))
            return { "success": true, "message": "" };
        else
            return { "success": false, "message": "Not allow" };
    }
    static async Check_F_RemoveConversation(user_id, arrParams: Object) {
        var paramValue = await this.GetParamByName(arrParams, "key");

        if (await this.CheckIsBackEnd(user_id) && await this.CheckIsSamePartner(user_id, "BookEvaluates", paramValue))
            return { "success": true, "message": "" };
        else
            return { "success": false, "message": "Not allow" };

    }
    static async GetParamByName(arrParams: Object, paramName: string): Promise<any> {

        var cArrParams = arrParams as [];
        for (var item of cArrParams) {
            if (item["key"] == paramName) {
                return item["value"];
            }
        }
        return null;
    }
    static async CheckIsSamePartner(user_id: string, tableName: string, id: number): Promise<boolean> {
        var memberInfo = await this.GetMemberInfo(user_id);
        var entity = await this.GetEntityById(id, tableName);
        if (memberInfo && entity && memberInfo["PartnerId"] == entity["PartnerId"])
            return true;
        else
            return false;
    }
    static async CheckIsBackEnd(user_id: string): Promise<boolean> {
        var memberInfo = await this.GetMemberInfo(user_id);
        if (memberInfo["Type"] <= 1)
            return false;
        else
            return true;
    }
    static async CheckPrivilige(user_id: string, partnerid: string, method: string, cotrollerName: string, data: JSON, id: number): Promise<any> {
        switch (cotrollerName) {
            case 'Books':
                return await this.CheckPrivilige_Book(user_id, method, data, id);
                break;

            case 'Authors':
                return await this.CheckPrivilige_Authors(user_id, method);

            case 'ACategories':
                return await this.CheckPrivilige_ArticleGroup(user_id, method, id, data, "ACategories");
            case 'Articles':
                return await this.CheckPrivilige_ArticleGroup(user_id, method, id, data, "Articles");
                break;
            case 'ArticleCategories':
                return await this.CheckPrivilige_ArticleGroup(user_id, method, id, data, "Articles");
                break;

            case 'Categories':
                return await this.CheckPrivilige_McbookAdmin(user_id, method, "Categories");
                break;
            case 'BookAuthors':
                return await this.CheckPrivilige_McbookAdmin(user_id, method, "BookAuthors");
                break;
            case 'BookCategories':
                return await this.CheckPrivilige_McbookAdmin(user_id, method, "BookCategories");
                break;
            case 'BookProductIncludes':
                return await this.CheckPrivilige_McbookAdmin(user_id, method, "BookProductIncludes");
                break;
            case 'ProductInclues':
                return await this.CheckPrivilige_McbookAdmin(user_id, method, "ProductInclues");
                break;
            case 'PartnerFees':
                return await this.CheckPrivilige_McbookAdmin(user_id, method, "PartnerFees");
                break;
            case 'PartnerNotifications':
                return await this.CheckPrivilige_PartnerNotification(user_id, method, data);
                break;
            case 'PartnerPromotions':
                return await this.CheckPrivilige_McbookAdmin(user_id, method, "PartnerPromotions");
                break;
            case 'PartnerPromotionDetails':
                return await this.CheckPrivilige_McbookAdmin(user_id, method, "PartnerPromotionDetails");
                break;
            case 'Configs':
                return await this.CheckPrivilige_McbookAdmin(user_id, method, "Configs");
                break;
            ////Configs

            case 'BookPromotions':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "BookPromotions");
                break;
            case 'CategoryPromotions':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "CategoryPromotions");
                break;
            case 'CMS_HomePages':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "CMS_HomePages");
                break;
            case 'CMS_Partners':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "CMS_Partners");
                break;
            case 'CMS_Shortcuts':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "CMS_Shortcuts");
                break;
            case 'ComboBooks':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "ComboBooks");
                break;
            case 'HotDeal':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "HotDeal");
                break;
            case 'PartnerAuthors':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "PartnerAuthors");
                break;
            case 'PartnerBooks':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "PartnerBooks");
                break;
            case 'PartnerCategories':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "PartnerCategories");
                break;
            case 'Promotions':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "Promotions");
                break;
            case 'Notifications':
                return await this.CheckPrivilige_PartnerAdmin(user_id, method, id, data, "Notifications");
                break;
            ///Notifications

            case 'MemberDeliveryInfos':
                return await this.CheckPrivilige_MemberGroup(user_id, method, id, "MemberDeliveryInfos");
                break;
            case 'MemberActions':
                return await this.CheckPrivilige_MemberActions(user_id, method, id, "MemberActions");
                break;
            case 'BookReserves':
                return await this.CheckPrivilige_MemberGroup(user_id, method, id, "BookReserves");
                break;

            case 'BookEvaluates':
                return await this.CheckPrivilige_BookEvaluates(user_id, method, id, "BookEvaluates");
                break;

            case 'Orders':
                return await this.CheckPrivilige_Order(user_id, method, id, data);
                break;

            case 'OrderBooks':
                return await this.CheckPrivilige_OrderBook(user_id, method, id);
                break;

            case 'OrderPayments':
                return await this.ReadOnly(method);
                break;
            case 'OrderStates':
                return await this.ReadOnly(method);
                break;

            case 'Members':
                return await this.CheckPrivilige_Member(user_id, method, id, data);
                break;

            case 'MemberCoins':
                return await this.CheckPrivilige_MemberConins(user_id, method);
                break;

            case 'Partners':
                return await this.CheckPrivilige_Partner(user_id, method, id);
                break;
            default:
                return { "success": true, "message": "" };
        }

    }

    static async ReadOnly(method) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        } else {
            return { "success": false, "message": "Cannot access." };
        }
    }

    static async CheckPrivilige_Partner(user_id: string, method: string, id: number) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id) {

            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {
                if (method === "POST") {
                    return { "success": true, "message": "" };
                }
                if (method === "PUT" || method === "PATCH") {
                    var entity = await this.GetEntityById(id, "Partners");
                    if (method === "PUT" && memberInfo["PartnerId"] != 1 && (memberInfo["PartnerId"] != entity["ParentId"])) {
                        return { "success": false, "message": "Method not allow" };
                    }
                    else {
                        if (memberInfo["Type"] <= 0)
                            return { "success": false, "message": "Not allow" };
                        if (memberInfo["PartnerId"] == 1)
                            return { "success": true, "message": "" };
                        else {

                            if (entity["ParentId"] == memberInfo["PartnerId"] || entity["Id"] == memberInfo["PartnerId"])
                                return { "success": true, "message": "" };
                        }
                        return { "success": false, "message": "Not allow" };
                    }
                }
            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };

        }
        else {
            return { "success": false, "message": "Not allow" };
        }
    }
    static async CheckPrivilige_MemberConins(user_id: string, method: string) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (method === "POST" || method === "PUT" || method === "DELETE")
            return { "success": false, "message": "Method not allow" };
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {

                if (memberInfo["Type"] <= 1 || memberInfo["PartnerId"] != 1)
                    return { "success": false, "message": "Not allow" };
            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };

        }
        else {
            return { "success": false, "message": "Not allow" };
        }
        return { "success": true, "message": "" };
    }

    static async CheckPrivilige_Member(user_id: string, method: string, id: number, data: any) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }

        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {
                if (method === "POST" || method === "PUT" || method === "DELETE") {
                    if (memberInfo["Type"] <= 0)
                        return { "success": false, "message": "Method not allow" };
                }
                else {
                    // if ((data["PartnerId"])) {
                    //     var entityPartner = await this.GetEntityById(data["PartnerId"], "Partners");
                    //     if (entityPartner && entityPartner["ParentId"] memberInfo["PartnerId"] != data["PartnerId"] && memberInfo["Id"] != id &&  && memberInfo["Type"] <= 1)

                    //         return { "success": false, "message": "Method not allow" };
                    // }
                    return { "success": true, "message": "" };
                }


            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
            return { "success": true, "message": "" };
        }
        else {

            return { "success": false, "message": "Not allow" };
        }
    }
    static async CheckPrivilige_OrderBook(user_id: string, method: string, id: number) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }

        if (method === "POST")
            return { "success": false, "message": "Method not allow" };
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {
                var entity = await this.GetEntityById(id, "OrderBooks");
                var orderEntity = await this.GetEntityById(entity["OrderId"], "Orders");
                if (memberInfo["Id"] != orderEntity["MemberId"])
                    return { "success": false, "message": "Not allow" };
            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
            return { "success": true, "message": "" };
        }
        else {
            var entity = await this.GetEntityById(id, "OrderBooks");
            var orderEntity = await this.GetEntityById(entity["OrderId"], "Orders");
            if (orderEntity["SessionId"] && orderEntity["SessionId"] != null)
                return { "success": true, "message": "" };
            else
                return { "success": false, "message": "Not allow" };
        }
    }

    static async CheckPrivilige_Order(user_id: string, method: string, id: number, data: JSON) {
        if (method === "GET" && (user_id)) {
            if (isNaN(id) === true) {
                return { "success": true, "message": "" };
            }
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {
                var entity = await this.GetEntityById(id, "Orders");
                if ((memberInfo["Id"] === entity["MemberId"]) || (memberInfo["PartnerId"] && memberInfo["PartnerId"] === 1) || (memberInfo["PartnerId"] === entity["PartnerId"])) {
                    return { "success": true, "message": "" };
                }

                if ((memberInfo["PartnerId"] && memberInfo["PartnerId"] !== 1)) {
                    var entityPartner = await this.GetEntityById(entity["PartnerId"], "Partners");
                    if (entityPartner && (entityPartner["ParentId"] === memberInfo["PartnerId"])) {
                        return { "success": true, "message": "" };
                    }
                }
            }

            return { "success": false, "message": "Not Allow" };
        }
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {
                if (method === "POST") {
                    if (memberInfo["Id"] != data["MemberId"]) {
                        return { "success": false, "message": "Not allow create Order for othes member" };
                    }
                }
                else {
                    if (method === "DELETE") {
                        return { "success": false, "message": "Not allow delete Order" };
                    }
                    var entity = await this.GetEntityById(id, "Orders");
                    if (memberInfo["PartnerId"] != 1 && entity["PartnerId"] != memberInfo["PartnerId"] && entity["MemberId"] != memberInfo["Id"])
                        return { "success": false, "message": "Not allow update Order of othes member" };
                }
                return { "success": true, "message": "" };
            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
        }
        else {
            if (method === "PUT" || method === "GET") {
                if (isNaN(id) === true) {
                    return { "success": true, "message": "" };
                }
                var orderEntity = await this.GetEntityById(id, "Orders");
                if (orderEntity["SessionId"] && orderEntity["SessionId"] != null)
                    return { "success": true, "message": "" };
                else
                    return { "success": false, "message": "Not allow" };
            } else
                return { "success": false, "message": "Not allow method" };
        }
    }
    //BookEvaluates
    static async CheckPrivilige_BookEvaluates(user_id: string, method: string, id: number, tableName: string) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {
                if (method != "POST") {

                    var entity = await this.GetEntityById(id, tableName);
                    if (entity["MemberId"] != memberInfo["Id"]) {
                        return { "success": false, "message": "Cannot delete" };
                    } else {
                        return { "success": true, "message": "" };
                    }

                }
                return { "success": true, "message": "" };
            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
        }
        else
            return { "success": false, "message": "Cannot indetify the member" };
    }

    static async CheckPrivilige_MemberActions(user_id: string, method: string, id: number, tableName: string) {
        if (method === "GET" || method === "POST") {
            return { "success": true, "message": "" };
        } else {
            return { "success": false, "message": "Method Not Allow" };
        }
    }

    static async CheckPrivilige_MemberGroup(user_id: string, method: string, id: number, tableName: string) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {
                if (method != "POST") {
                    var entity = await this.GetEntityById(id, tableName);
                    if (entity["MemberId"] != memberInfo["Id"]) {
                        return { "success": false, "message": "Cannot create delivery addresss for others member" };
                    }
                }
                return { "success": true, "message": "" };
            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
        }
        else
            return { "success": false, "message": "Cannot indetify the member" };
    }
    static async CheckPrivilige_PartnerAdmin(user_id: string, method: string, id: number, data: JSON, tableName: string) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {

                if (memberInfo["Type"] > 0) {
                    if (method === "POST") {
                        if (memberInfo["PartnerId"] != data["PartnerId"]) {
                            return { "success": false, "message": "Not allow create data for others partner" };
                        }
                    }
                    else {
                        var entity = await this.GetEntityById(id, tableName);
                        if (entity["PartnerId"] != memberInfo["PartnerId"]) {
                            return { "success": false, "message": "Not allow update data of others partner" };
                        }
                    }
                    return { "success": true, "message": "" };
                }
                else {
                    return { "success": false, "message": "Not allow" };
                }

            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
        }
        else
            return { "success": false, "message": "Cannot indetify the member" };
    }

    static async CheckPrivilige_PartnerNotification(user_id: string, method: string, data: any) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {
                if (method === "POST") {

                    if (memberInfo.PartnerId === 1) {
                        return { "success": true, "message": "" };
                    } else {
                        const curPartner = await this.GetEntityById(memberInfo.PartnerId, "Partners");
                        if (curPartner.Level === 1 && data.PartnerId === -2) {
                            return { "success": true, "message": "" };
                        } else if (curPartner.Level === 2) {
                            return { "success": false, "message": "Not Allow" };
                        }

                        const sentPartner = await this.GetEntityById(data.PartnerId, "Partners");
                        if (sentPartner && sentPartner.ParentId === memberInfo.PartnerId) {
                            return { "success": true, "message": "" };
                        } else {
                            return { "success": false, "message": "Not Allow" };
                        }
                    }

                } else {
                    return { "success": false, "message": "Not Allow" };
                }
            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
        }
        // khong phai member, return false;
        else
            return { "success": false, "message": "Cannot indetify the member" };
    }

    static async CheckPrivilige_McbookAdmin(user_id: string, method: string, tableName: string, data: any = null) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {

                if (method === "POST" && data != null) {
                    if (memberInfo["Type"] > 0 && memberInfo["PartnerId"] == 1) {
                        return { "success": true, "message": "" };
                    }
                    const entityPartner = await this.GetEntityById(data.PartnerId, "Partners");
                    if (memberInfo["PartnerId"] > 1 && (entityPartner && entityPartner.ParentId == memberInfo["PartnerId"])) {
                        return { "success": true, "message": "" };
                    } else {
                        return { "success": false, "message": "Not allow" };
                    }
                }

                if (memberInfo["Type"] > 0 && memberInfo["PartnerId"] == 1) {

                    return { "success": true, "message": "" };
                }
                else {
                    return { "success": false, "message": "Not allow" };
                }

            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
        }
        else
            return { "success": false, "message": "Cannot indetify the member" };
    }
    static async CheckPrivilige_ArticleCategories(user_id: string, method: string, id: number, data: JSON, tableName: string) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {

                if (memberInfo["Type"] > 0) {
                    if (method === "POST") {
                        var ArticleEntity = await this.GetEntityById(data["ArticleId"], "Articles");
                        var ACategoryEntity = await this.GetEntityById(data["ACategoryId"], "ACategories");
                        if (memberInfo["PartnerId"] != ArticleEntity["PartnerId"] || memberInfo["PartnerId"] != ACategoryEntity["PartnerId"])
                            return { "success": false, "message": "Not allow" };
                    }
                    else {
                        var entity = await this.GetEntityById(id, "ArticleCategories");
                        var ArticleEntity = await this.GetEntityById(entity["ArticleId"], "Articles");
                        var ACategoryEntity = await this.GetEntityById(entity["ACategoryId"], "ACategories");
                        if (memberInfo["PartnerId"] != ArticleEntity["PartnerId"] || memberInfo["PartnerId"] != ACategoryEntity["PartnerId"])
                            return { "success": false, "message": "Not allow" };
                    }
                    return { "success": true, "message": "" };
                }
                else {
                    return { "success": false, "message": "Not allow" };
                }

            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
        }
        else
            return { "success": false, "message": "Cannot indetify the member" };
    }

    static async CheckPrivilige_ArticleGroup(user_id: string, method: string, id: number, data: JSON, tableName: string) {
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {

                if (memberInfo["Type"] > 0) {
                    // if (data["PartnerId"] != memberInfo["PartnerId"]) {
                    //     return { "success": false, "message": "Not allow update data for others partner" };
                    // }
                    if (method === "PUT" || method === "PATCH" || method === "DELETE") {
                        var entity = await this.GetEntityById(id, tableName);
                        if (memberInfo["PartnerId"] != 1 && entity["PartnerId"] != memberInfo["PartnerId"])
                            return { "success": false, "message": "Not allow update data for others partner" };
                    }

                    return { "success": true, "message": "" };
                }
                else {
                    return { "success": false, "message": "Not allow" };
                }

            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
        }
        else
            return { "success": false, "message": "Cannot indetify the member" };
    }
    static async CheckPrivilige_Authors(user_id: string, method: string): Promise<any> {
        // tat ca co quyen get
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {
                // quan tri cua mcbook co toan quyen post, put, patch, delete
                if (memberInfo["Type"] > 0 && memberInfo["PartnerId"] == 1)
                    return { "success": true, "message": "" };
                else {
                    return { "success": false, "message": "Not allow( only Mcbook admin have privilige on this resource)" };
                }

            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
        }
        else
            return { "success": false, "message": "Cannot indetify the member" };
    }
    static async CheckPrivilige_Book(user_id: string, method: string, data: JSON, id: number): Promise<any> {
        // tat ca co quyen get
        if (method === "GET") {
            return { "success": true, "message": "" };
        }
        if (user_id) {
            var memberInfo = await this.GetMemberInfo(user_id);
            if (memberInfo != null) {

                if (memberInfo["Type"] > 0 && memberInfo["PartnerId"] == 1)
                    return { "success": true, "message": "" };
                else {
                    // truong hop post, so sanh PartnerId trong data gui len co khop voi partnerId cua user hien tai
                    if (method === "POST") {
                        if (data["ComboPartnerId"] != memberInfo["PartnerId"])
                            return { "success": false, "message": "Not allow create combo for others partner" };

                        if (!data["IsCombo"])
                            return { "success": false, "message": "Not allow create book" };
                        return { "success": true, "message": "" };
                    }
                    else {

                        var bookDetail = await this.GetEntityById(id, "Books");
                        if (bookDetail != null) {
                            if (!bookDetail["IsCombo"])
                                return { "success": false, "message": "Not allow edit/delete book" };
                            if (bookDetail["ComboPartnerId"] != memberInfo["PartnerId"])
                                return { "success": false, "message": "Not allow edit/delete combo of others partner" };
                            return { "success": true, "message": "" };
                        }

                        return { "success": false, "message": "Cannot find the resource" };

                    }

                }

            }
            // khong phai member, return false;
            else
                return { "success": false, "message": "Cannot indetify the member" };
        }
        else
            return { "success": false, "message": "Cannot indetify the member" };
    }
    static async GetMemberInfo(user_id: string) {
        const db = await connect();
        var queryResult = await db.query('Select * from "Members" where "user_id" =$1', [user_id]);
        if (queryResult.rows.length > 0)
            return { "Id": queryResult.rows[0]["Id"], "Type": queryResult.rows[0]["type"], "PartnerId": queryResult.rows[0]["PartnerId"] };
        else
            return null;
    }
    static async GetEntityById(id: number, tableName: string) {
        const db = await connect();
        var queryResult = await db.query('Select * from "' + tableName + '" where "Id" =$1', [id]);
        if (queryResult.rows.length > 0)
            return queryResult.rows[0];
        else
            return null;
    }
}