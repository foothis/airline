/**
 * SAS Airlines App — Configuration
 *
 * REQUIRED: Set VG_ENDPOINT_URL to your Voice Gateway endpoint.
 * This is found in Cognigy.AI under Deploy → Endpoints → (Voice Gateway endpoint)
 * It looks like: https://voice-gateway-trial.cognigy.ai/YOUR_TOKEN
 *
 * This is DIFFERENT from the REST endpoint used for webchat.
 */
window.SAS_CONFIG = {
  // Voice Gateway endpoint for Click-to-Call SDK
  // TODO: Replace with real VG endpoint URL
  // Provided by user — confirm this is the Voice Gateway endpoint (not REST)
  VG_ENDPOINT_URL: 'https://endpoint-trial.cognigy.ai/8c65767bf5023ca48f12a07d4c9ebd8ef32eed57b6d1dab4633ceb7a8689c24d',

  // User ID passed to the SDK (can be dynamic)
  USER_ID: 'sas-demo-user',

  // Demo passenger name shown on home screen
  PASSENGER_NAME: 'Erik',

  // Demo booking references (must match mock CRM data in Cognigy flow)
  DEMO_BOOKINGS: {
    SK7234: {
      passenger: 'Erik Johansson',
      route: 'ARN → CPH',
      flight: 'SK 425',
      date: 'Apr 15, 2026',
      class: 'SAS Go'
    },
    SK9981: {
      passenger: 'Anna Lindqvist',
      route: 'OSL → LHR',
      flight: 'SK 1503',
      date: 'May 3, 2026',
      class: 'SAS Plus'
    }
  }
};
