const { google } = require('googleapis');

class GoogleMeetService {
  constructor() {
    // Setup Google OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Generate unique Google Meet link untuk setiap konsultasi
  async createMeetingLink(bookingDetail) {
    try {
      const startDateTime = new Date(`${bookingDetail.consultation_date} ${bookingDetail.consultation_time}`);
      const endDateTime = new Date(startDateTime.getTime() + (30 * 60 * 1000)); // 30 menit konsultasi

      const event = {
        summary: `Konsultasi dengan ${bookingDetail.doctor_name}`,
        description: `Konsultasi kesehatan melalui Glucease\nPasien: ${bookingDetail.patient_name}\nBooking ID: ${bookingDetail.id}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Asia/Jakarta',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Asia/Jakarta',
        },
        attendees: [
          { email: bookingDetail.patient_email },
          { email: bookingDetail.doctor_email }
        ],
        conferenceData: {
          createRequest: {
            requestId: `glucease-${bookingDetail.id}-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all'
      });

      // Extract Google Meet link dari response
      const meetLink = response.data.conferenceData?.entryPoints?.find(
        entry => entry.entryPointType === 'video'
      )?.uri;

      return {
        meetLink,
        eventId: response.data.id,
        eventUrl: response.data.htmlLink
      };

    } catch (error) {
      console.error('Error creating Google Meet link:', error);
      throw new Error('Failed to create meeting link');
    }
  }

  // Alternative: Generate simple unique meeting room
  generateSimpleMeetLink(bookingId) {
    // Format: https://meet.google.com/glu-ease-[booking-id]
    const roomCode = `glu-ease-${bookingId}`.replace(/[^a-z0-9-]/g, '');
    return `https://meet.google.com/${roomCode}`;
  }
}