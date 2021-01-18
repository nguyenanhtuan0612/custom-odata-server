import { Constants } from "./constants";

export class Utils {
    public static formatMoney(value: number, unit?): string {
        if (!value) {
            value = 0;
        }
        if (!unit) {
            unit = Constants.Money.VN;
        }
        const p = Number(value).toFixed(2).split('.');
        return p[0].split('').reverse().reduce(function (acc, num, i, orig) {
            return num === '-' ? acc : num + (i && !(i % 3) ? ',' : '') + acc;
        }, '') + (unit !== Constants.Money.VN ? '.' + p[1] : '') + ' ' + unit;
    }

    public static escapeRegExp(str): string {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    public static async removeAccents(str) {
        return await str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');

    }

    public static emailIsValid(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    public static replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

    public static isNullOrUndefined(value: any): boolean {
        if (typeof value === 'undefined' || value === null) {
            return true;
        } else {
            return false;
        }
    }
}
