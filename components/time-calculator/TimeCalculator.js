    function extractFormats(message) {
        const serverTimezone = 'UTC';
        const regexp = /^(?:\D*)(\d+\s*days?)?(?:\D*)(\d{1,2}\s*hours?)?(?:\D*)(\d{1,2}\s*minutes?)?(?:.*)$/i;
        let parts = message.match(regexp);

        console.log(parts);

        if (!parts) return;

        let out = {
            days: null,
            hours: null,
            minutes: null,
        }

        parts.forEach(element => {
            if (element) {
                if (element.includes('day')) {
                    out.days = element.match(/\d+/);
                } else if (element.includes('hour')) {
                    out.hours = element.match(/\d+/);
                } else if (element.includes('minute')) {
                    out.minutes = element.match(/\d+/);
                }
            }
        });

        console.log(out);

        return out;
    }

    module.exports = {
        extractFormats: extractFormats,
    };