export const titleToRoute = (title: string): string => {
    const slug = title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '');
    return slug ? `/${slug}` : '/';
};
