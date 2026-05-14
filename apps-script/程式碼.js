const SPREADSHEET_ID = '1UaPT4kGMhvF8rAsO8N6rqB7I9_Wv7Q1BNDu_XecW8zk';
const SHEET_STUDENTS = '學生資料';
const SHEET_SESSIONS = '授課紀錄';

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const studentSheet = ss.getSheetByName(SHEET_STUDENTS);
  const studentRows = studentSheet.getDataRange().getValues();
  const studentHeaders = studentRows[0];
  const students = studentRows.slice(1).map(row => {
    const obj = {};
    studentHeaders.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  const sessionSheet = ss.getSheetByName(SHEET_SESSIONS);
  const sessionRows = sessionSheet.getDataRange().getValues();
  let sessions = [];
  if (sessionRows.length > 1) {
    const sessionHeaders = sessionRows[0];
    sessions = sessionRows.slice(1).map(row => {
      const obj = {};
      sessionHeaders.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  }

  return res({ success: true, students, sessions });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'addLog') {
      const sheet = ss.getSheetByName(SHEET_SESSIONS);
      sheet.appendRow([
        body.student_id,
        body.session_number,
        body.cycle_position,
        body.timestamp,
        body.is_pay_session
      ]);
      return res({ success: true });
    }

    if (body.action === 'sendEmail') {
      GmailApp.sendEmail(body.to, body.subject, body.body);
      return res({ success: true });
    }

    return res({ success: false, error: 'Unknown action' });
  } catch(err) {
    return res({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function res(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

