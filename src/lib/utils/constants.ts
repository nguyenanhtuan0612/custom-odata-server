export namespace Constants {
    export class ColumnTitle {
        static readonly ACTIONS = 'Thao tác';
    }
    export class DateTime {
        static readonly DATE_FORMAT = 'dd/MM/yyyy';
        static readonly DATETIME_FORMAT = 'dd/MM/yyyy H:mm';
    }
    export class Money {
        static readonly VN = 'VNĐ';
    }
    export class Query_Type {
        static readonly Paging = 'paging';
        static readonly Excel = 'excel';
        static readonly Notification = 'notification';
        static readonly Email = 'email';
        static readonly SMS = 'sms';
    }
    export class Action {
        static readonly SentNotification = {
            value: 1,
            title: 'Gửi thông báo'
        };
        static readonly ExportExcel = {
            value: 2,
            title: 'Xuất kết quả ra file excel'
        };
        static readonly SentEmail = {
            value: 3,
            title: 'Gửi email'
        };
        static readonly SentSMS = {
            value: 4,
            title: 'Gửi SMS'
        };
        static readonly AddUser = {
            value: 5,
            title: 'Thêm người dùng'
        };
        static readonly RemoveUser = {
            value: 6,
            title: 'Gỡ bỏ người dùng'
        };
    }
    export const OrderStatuses = new Map([
        [-1, { Label: 'Đang xử lí thanh toán', HTML: '<div class="text-center"><span class="badge badge-pill badge-warning badge-status">{0}</span></div>' }],
        [-2, { Label: 'Đợi thanh toán', HTML: '<div class="text-center"><span class="badge badge-pill badge-warning badge-status">{0}</span></div>' }],
        [1, { Label: 'Đã đặt hàng', HTML: '<div class="text-center"><span class="badge badge-pill badge-info badge-status">{0}</span></div>' }],
        [2, { Label: 'Đã xác nhận', HTML: '<div class="text-center"><span class="badge badge-pill badge-primary badge-status">{0}</span></div>' }],
        [3, { Label: 'Đang vận chuyển', HTML: '<div class="text-center"><span class="badge badge-pill badge-warning badge-status">{0}</span></div>' }],
        [4, { Label: 'Đã giao hàng', HTML: '<div class="text-center"><span class="badge badge-pill badge-success badge-status">{0}</span></div>' }],
        [6, { Label: 'Giao hàng thất bại', HTML: '<div class="text-center"><span class="badge badge-pill badge-gray badge-status">{0}</span></div>' }],
        // [5, { Label: 'Hoàn thành', HTML: '<div class="text-center"><span class="badge badge-pill badge-success badge-status">{0}</span></div>' }],
        [7, { Label: 'Đã hủy', HTML: '<div class="text-center"><span class="badge badge-pill badge-dark badge-status">{0}</span></div>' }],
        [8, { Label: 'Hoàn hàng', HTML: '<div class="text-center"><span class="badge badge-pill badge-danger badge-status">{0}</span></div>' }],
    ]);
    export class OrderPaymentStatuses {
        static readonly NoPaymentYet = { value: 0, title: 'Chưa thanh toán' };
        static readonly Payment = { value: 1, title: 'Đã thanh toán' };
    }

    export class AppId {
        static readonly Bizbook_Vip = "Bizbook";
        static readonly TKBook_Vip = "TKBook";
    }
}

