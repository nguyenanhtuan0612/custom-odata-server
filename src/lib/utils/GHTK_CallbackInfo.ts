export class GHTK_CallbackInfo {
    //id, user_id, email, email_constraint, email_verified, enabled, first_name, last_name, realm_id, username, created_timestamp
    constructor(partner_id,label_id,status_id,action_time,reason_code,reason,weight,fee,pick_money) {
        this.partner_id=partner_id;
        this.label_id=label_id;
        this.status_id=status_id;
        this.action_time=action_time;
        this.reason_code=reason_code;
        this.reason=reason;
        this.weight=weight;
        this.fee=fee;
        this.pick_money=pick_money;        
    }
    partner_id: string;
    label_id:string;
    status_id:number;
    action_time:Date;
    reason_code:string;
    reason:string;
    weight:number;
    fee:number;
    pick_money:number;
    
}
