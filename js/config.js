window.SAS_CONFIG = {
  // Voice Gateway endpoint for Click-to-Call SDK
  VG_ENDPOINT_URL: 'https://endpoint-trial.cognigy.ai/8c65767bf5023ca48f12a07d4c9ebd8ef32eed57b6d1dab4633ceb7a8689c24d',

  // User ID passed to the SDK (can be dynamic / per-demo)
  USER_ID: 'sas-demo-user',

  // Demo booking references (match mock CRM data in Cognigy flow)
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
