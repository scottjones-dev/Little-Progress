/*
 * Removes personal and health data from what we send to Sentry. It is used by every runtime
 * (API, web, native) through baseSentryOptions(), so the rules are written once.
 *
 * Types are structural on purpose: this file does not import any Sentry SDK, and the SDKs'
 * own event and breadcrumb types are assignable to these.
 */

export const filtered = "[Filtered]";

/** Object keys whose value must never be sent (checked case-insensitively, any depth). */
const sensitiveKey =
  /pass(?:word|wd)?|secret|token|authorization|cookie|api[-_]?key|note|email|phone|birth|dob|pin|otp|code|signature/iu;

/** Query parameters that carry one-time links, codes or identities. */
const sensitiveQueryParam =
  /token|code|key|secret|email|state|password|signature|invitation/iu;

/** Request headers that identify a person or carry a credential. */
const sensitiveHeader =
  /^(?:authorization|cookie|set-cookie|x-forwarded-for|x-real-ip|cf-connecting-ip|x-api-key|novu-signature)$/iu;

/** Path segments that are one-time secrets, e.g. /reset-password/<token>. */
const secretPathSegment =
  /\/(?<section>reset-password|accept-invitation|delete-account|verify-email)\/[^/?#]+/giu;

const maxDepth = 6;

export interface ScrubbableBreadcrumb {
  category?: string;
  data?: Record<string, unknown>;
  message?: string;
}

export interface ScrubbableEvent {
  breadcrumbs?: ScrubbableBreadcrumb[];
  contexts?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  request?: {
    cookies?: unknown;
    data?: unknown;
    headers?: Record<string, string>;
    query_string?: unknown;
    url?: string;
  };
  server_name?: string;
  user?: {
    email?: string;
    id?: number | string;
    ip_address?: string | null;
    username?: string;
  };
}

/** Hides one-time secrets in a URL: sensitive query values and secret path segments. */
export const scrubUrl = (url: string) => {
  const withoutSecretPaths = url.replace(
    secretPathSegment,
    "/$<section>/[Filtered]"
  );
  const [path = "", query] = withoutSecretPaths.split("?");
  if (!query) {
    return withoutSecretPaths;
  }
  const [search = "", hash] = query.split("#");
  const cleaned = new URLSearchParams();
  for (const [name, value] of new URLSearchParams(search)) {
    cleaned.append(name, sensitiveQueryParam.test(name) ? filtered : value);
  }
  const cleanQuery = cleaned.toString();
  return `${path}${cleanQuery ? `?${cleanQuery}` : ""}${hash ? `#${hash}` : ""}`;
};

const scrubValue = (value: unknown, depth: number): unknown => {
  if (depth > maxDepth) {
    return filtered;
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      clean[key] = sensitiveKey.test(key)
        ? filtered
        : scrubValue(inner, depth + 1);
    }
    return clean;
  }
  return value;
};

const requestBodyCategories = new Set(["fetch", "xhr", "http"]);

/**
 * For Sentry's `beforeBreadcrumb`. Returns null to drop the breadcrumb.
 * Console output and taps/typing are dropped (they can contain names, notes or ids);
 * network breadcrumbs keep the method and status but lose bodies and query secrets.
 */
export const scrubBreadcrumb = <B extends ScrubbableBreadcrumb>(
  breadcrumb: B
): B | null => {
  const category = breadcrumb.category ?? "";
  if (category === "console" || category.startsWith("ui.")) {
    return null;
  }
  if (!breadcrumb.data) {
    return breadcrumb;
  }
  // SAFETY: scrubValue returns an object for an object input, and breadcrumb.data is an object.
  const data = scrubValue(breadcrumb.data, 0) as Record<string, unknown>;
  if (requestBodyCategories.has(category) && typeof data.url === "string") {
    data.url = scrubUrl(data.url);
  }
  return { ...breadcrumb, data };
};

/** For Sentry's `beforeSend`. Removes request bodies, credentials and personal fields. */
export const scrubEvent = <E extends ScrubbableEvent>(event: E): E => {
  const clean: E = { ...event };

  if (clean.request) {
    // Cookies, body and query string are left out of `rest` on purpose.
    const {
      cookies: _cookies,
      data: _data,
      headers,
      query_string: _queryString,
      url,
      ...rest
    } = clean.request;
    const safeHeaders = Object.fromEntries(
      Object.entries(headers ?? {}).filter(
        ([name]) => !sensitiveHeader.test(name)
      )
    );
    clean.request = {
      ...rest,
      headers: safeHeaders,
      url: url ? scrubUrl(url) : url,
    };
  }

  // Keep an opaque id only; never an email, username or IP address.
  if (clean.user) {
    clean.user = clean.user.id ? { id: clean.user.id } : {};
  }

  if (clean.extra) {
    // SAFETY: scrubValue returns an object for an object input.
    clean.extra = scrubValue(clean.extra, 0) as Record<string, unknown>;
  }
  if (clean.contexts) {
    // SAFETY: scrubValue returns an object for an object input.
    clean.contexts = scrubValue(clean.contexts, 0) as Record<string, unknown>;
  }
  if (clean.breadcrumbs) {
    clean.breadcrumbs = clean.breadcrumbs.flatMap((crumb) => {
      const kept = scrubBreadcrumb(crumb);
      return kept ? [kept] : [];
    });
  }
  // The host name can identify infrastructure and people's machines in development.
  clean.server_name = undefined;

  return clean;
};
