export const PHONE_REGEX = /^1[3-9]\d{9}$/;

export const ID_CARD_REGEX = /^[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const SUBDOMAIN_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

export const PRICE_REGEX = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
