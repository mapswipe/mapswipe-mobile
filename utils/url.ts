// Release builds block cleartext HTTP, so http:// tile URLs never load.
export default function upgradeToHttps<T extends string | undefined>(url: T): T {
    if (typeof url !== 'string') {
        return url;
    }
    return url.replace(/^http:\/\//i, 'https://') as T;
}
