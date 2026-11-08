/** Centralized public contact links: never fabricate phone numbers or publish drafts. */
export const validContactNumber=(value:unknown):value is string =>
  typeof value==='string' && /^[1-9][0-9]{9,14}$/.test(value);

export function whatsappContact(number:unknown,message:string):string|null {
  return validContactNumber(number)
    ? 'https://wa.me/'+number+'?text='+encodeURIComponent(message.slice(0,850))
    : null;
}
export function callingContact(number:unknown):string|null {
  return validContactNumber(number)?'tel:+'+number:null;
}
