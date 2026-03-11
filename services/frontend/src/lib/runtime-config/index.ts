const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '');

const getRuntimeApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const { origin, hostname } = window.location;
  const labels = hostname.split('.');

  if ((labels[0] === 'app' || labels[0] === 'admin') && labels.length >= 3) {
    return normalizeBaseUrl(origin.replace(`${labels[0]}.`, 'api.'));
  }

  return '';
};

export const getApiBaseUrl = () => {
  const runtimeApiBaseUrl = getRuntimeApiBaseUrl();

  if (runtimeApiBaseUrl) {
    return runtimeApiBaseUrl;
  }

  const configuredBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  if (typeof window !== 'undefined') {
    return normalizeBaseUrl(window.location.origin);
  }

  return 'http://localhost:8787';
};

export const getAuthBaseUrl = () => {
  const explicitAuthUrl = import.meta.env.VITE_AUTH_BASE_URL;

  if (explicitAuthUrl && !getRuntimeApiBaseUrl()) {
    return normalizeBaseUrl(explicitAuthUrl);
  }

  return `${getApiBaseUrl()}/api/auth`;
};