export function getDbUri(request: Request): string | undefined {
    return request.headers.get('x-mongodb-url') || undefined;
}