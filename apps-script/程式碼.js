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

    if (body.action === 'updateStudent') {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      const rows = sheet.getDataRange().getValues();
      const headers = rows[0];
      const idCol = headers.indexOf('student_id');
      const pageCol = headers.indexOf('textbook_page');
      const link1Col = headers.indexOf('gamma_link_1');
      const link2Col = headers.indexOf('gamma_link_2');
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][idCol]) === String(body.student_id)) {
          if (body.textbook_page !== undefined) sheet.getRange(i + 1, pageCol + 1).setValue(body.textbook_page);
          if (body.gamma_link_1 !== undefined) sheet.getRange(i + 1, link1Col + 1).setValue(body.gamma_link_1);
          if (body.gamma_link_2 !== undefined) sheet.getRange(i + 1, link2Col + 1).setValue(body.gamma_link_2);
          return res({ success: true });
        }
      }
      return res({ success: false, error: 'Student not found' });
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

