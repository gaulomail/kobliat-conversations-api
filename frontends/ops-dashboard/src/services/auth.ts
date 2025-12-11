export const AUTH_KEY = 'ops_dashboard_auth';
export const ACCESS_CODE = 'admin'; // Simple code-driven auth

export const login = (code: string): boolean => {
    if (code === ACCESS_CODE) {
        localStorage.setItem(AUTH_KEY, 'true');
        return true;
    }
    return false;
};

export const logout = () => {
    localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
    return localStorage.getItem(AUTH_KEY) === 'true';
};
