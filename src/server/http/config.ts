import { environment } from "../utils/environment";

export const configHandler = {
    GET() {
        return Response.json({
            smtpPort: environment.KAFRAINBOX_SMTP_SERVER_PORT,
        });
    },
};
