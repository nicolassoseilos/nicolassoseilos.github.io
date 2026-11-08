/* Agentium website settings. Both server pieces are SWITCHED OFF until they are set up (see server/README.md).
   bookingApi: address of the small booking service (free times from Nicolas's calendar + booking). Empty = "Booking opens soon".
   tryMariaUrl: address of the live "Try Maria" voice service. Empty = the box shows "opens soon".
   Add ?demo to any page address to see both working with made-up data (nothing is booked, nothing is sent).
   turnstileSiteKey: Cloudflare Turnstile site key for the invisible human check when a Try Maria call starts (empty = none).
*/
window.AGENTIUM_CONFIG = { bookingApi: "", tryMariaUrl: "", turnstileSiteKey: "" };
