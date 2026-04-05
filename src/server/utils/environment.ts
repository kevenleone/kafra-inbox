import * as v from "valibot";

const transformBoolean = (s: string) => s === "true" || s === "1";

const environmentSchema = v.object({
    KAFRAINBOX_DANGEROUSLY_NO_AUTH: v.optional(
        v.pipe(v.string(), v.transform(transformBoolean)),
        "false",
    ),

    KAFRAINBOX_DEFAULT_INBOX_PASSWORD: v.optional(v.string()),

    KAFRAINBOX_DEFAULT_INBOX_USERNAME: v.optional(v.string()),

    KAFRAINBOX_HTTP_SERVER_PORT: v.optional(
        v.pipe(
            v.string(),
            v.transform((s) => parseInt(s, 10)),
        ),
        "3134",
    ),

    KAFRAINBOX_SMTP_SERVER_PORT: v.optional(
        v.pipe(
            v.string(),
            v.transform((s) => parseInt(s, 10)),
        ),
        "1025",
    ),

    KAFRAINBOX_SMTP_SERVER_AUTH_OPTIONAL: v.optional(
        v.pipe(v.string(), v.transform(transformBoolean)),
        "false",
    ),

    KAFRAINBOX_SMTP_SERVER_AUTH_SECURE: v.optional(
        v.pipe(v.string(), v.transform(transformBoolean)),
        "false",
    ),

    KAFRAINBOX_SMTP_SERVER_LOGGER: v.optional(
        v.pipe(v.string(), v.transform(transformBoolean)),
        "false",
    ),
});

export const environment = v.parse(environmentSchema, Bun.env);
