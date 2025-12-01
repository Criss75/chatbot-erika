// clients/erikajurescu/config.ts

export const erikaJurescuConfig = {
  id: "erikajurescu",
  name: "Cabinet psihologic Erika Jurescu",
  businessType: "psiholog",
  defaultLocale: "ro",
  locales: ["ro"],
  timezone: "Europe/Bucharest",
  channels: {
    webchat: {
      enabled: true,
      widgetTitle: "Chat cabinet psihologic",
      greeting: "Bună! Sunt asistentul virtual al cabinetului psihologic. Cu ce vă pot ajuta?",
    },
  },
  contact: {
    // COMPLETEAZĂ TU CÂND AI DATELE REALE
    phone: null,
    email: null,
    website: null,
    address: null,
    bookingLink: null, // ex: link către calendly / formular
  },
  behaviour: {
    leadCaptureEnabled: true,
    askForContactOnBookingIntent: true,
    emergencyDisclaimerEnabled: true,
  },
};
