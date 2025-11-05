export function isProd(env: Env) {
    return env.ENVIRONMENT === 'prod' || env.ENVIRONMENT === 'production';
}

export function isDev(env: Env) {
    return env.ENVIRONMENT === 'dev' || env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'local';
}

export function isEnabled(value: unknown): boolean {
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        return v === '1' || v === 'true' || v === 'yes' || v === 'on';
    }
    return !!value;
}
