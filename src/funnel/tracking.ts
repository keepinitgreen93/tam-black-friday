/* TAM Black Friday 2026 — form tracking + contact tagging.
   Fires external-tracking events to create/update CRM contacts.
   The CRM applies tags via workflows keyed on formId. */
const TRACKING_URL = "https://backend.leadconnectorhq.com/external-tracking/events";
const TRACKING_ID = "tk_319b928ae52d420c9c8f636580f71ac3";
const LOCATION_ID = "1YuXNjATfxW5vhLfX1pq";
const PROJECT_ID = "1794979071005660821";

// trackingPayload.formData/formLabels are only for standard CRM field keys.
// Non-standard/custom fields must go through customFields using the id
// returned by register_custom_field. Labels stay human-readable.
type StandardTrackingFieldKey = string;
type RegisteredCustomFieldId = string;
type TrackingCustomField = { value?: unknown; label: string };

const getTrackingSessionId = () => {
  try {
    const sid = document.cookie.match(/(?:^|;\s*)__vibe_sid=([0-9a-f-]{36})(?:;|$)/)?.[1];
    if (sid) return sid;
  } catch {}
  return crypto.randomUUID();
};

const deviceType = () =>
  /Mobile|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop";

export function postTrackingEvent(
  trackingPayload: Record<string, unknown> & {
    formData: Record<StandardTrackingFieldKey, unknown>;
    formLabels: Record<StandardTrackingFieldKey, string>;
  },
  options: {
    customFields?: Record<RegisteredCustomFieldId, TrackingCustomField>;
  } = {},
) {
  const { customFields = {} } = options;
  const eventPayload = {
    ...trackingPayload,
    formData: { ...trackingPayload.formData },
    formLabels: { ...trackingPayload.formLabels },
  };
  const body = new FormData();

  for (const [key, field] of Object.entries(customFields)) {
    if (field.value === undefined) continue;
    eventPayload.formData[key] = field.value;
    eventPayload.formLabels[key] = field.label;
  }

  for (const key of Object.keys(eventPayload.formData)) {
    eventPayload.formLabels[key] ||= key;
  }

  body.append("event", JSON.stringify(eventPayload));

  fetch(TRACKING_URL, {
    method: "POST",
    headers: { version: "2021-07-28" },
    body,
  }).catch(() => {}); // Fire-and-forget — don't block form UX
}

const basePayload = (formId: string, formName: string) => ({
  type: "external_form_submission" as const,
  timestamp: Date.now(),
  formId,
  formData: {} as Record<string, unknown>,
  formLabels: {} as Record<string, string>,
  url: window.location.href,
  title: document.title,
  path: window.location.pathname,
  userAgent: navigator.userAgent,
  trackingId: TRACKING_ID,
  locationId: LOCATION_ID,
  projectId: PROJECT_ID,
  sessionId: getTrackingSessionId(),
  properties: {
    deviceType: deviceType(),
    source: "ai_studio",
    projectId: PROJECT_ID,
    formName,
  },
});

/** Fire a tracking event for the $97 buyer (from checkout onSuccess).
 *  The CRM workflow for formId "bf2026-checkout" applies tag "bf2026-buyer". */
export function fireBuyerTracking(buyer: {
  name: string;
  email: string;
  phone?: string;
}) {
  const parts = buyer.name.trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ");
  postTrackingEvent({
    ...basePayload("bf2026-checkout", "BF2026 Checkout"),
    formData: {
      first_name: firstName,
      last_name: lastName,
      email: buyer.email,
      ...(buyer.phone ? { phone: buyer.phone } : {}),
    },
    formLabels: {
      first_name: "First name",
      last_name: "Last name",
      email: "Email",
      phone: "Mobile phone",
    },
  });
}

/** Fire a tracking event for the foundation application.
 *  The CRM workflow for formId "foundation-application" applies tag "foundation-applicant". */
export function fireFoundationApplication(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  answers: Record<RegisteredCustomFieldId, { value: string; label: string }>;
}) {
  const customFields: Record<RegisteredCustomFieldId, TrackingCustomField> = {};
  for (const [id, entry] of Object.entries(data.answers)) {
    customFields[id] = { value: entry.value, label: entry.label };
  }
  postTrackingEvent(
    {
      ...basePayload("foundation-application", "AI Growth Foundation Application"),
      formData: {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
      },
      formLabels: {
        first_name: "First name",
        last_name: "Last name",
        email: "Email",
        phone: "Mobile phone",
      },
    },
    { customFields },
  );
}

/** Fire a tracking event for the teammate addition on the thank-you page. */
export function fireTeammateTracking(data: {
  email: string;
  teammateName: string;
  teammateEmail: string;
}) {
  postTrackingEvent({
    ...basePayload("bf2026-teammate", "BF2026 Teammate"),
    formData: {
      email: data.email,
    },
    formLabels: {
      email: "Email",
    },
  });
}
