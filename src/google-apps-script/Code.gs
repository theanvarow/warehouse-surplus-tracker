/**
 * VP Pershot - Ortiqcha tovarlarni fiksatsiya qilish Google Apps Script (Uzum PVZ qo'llab-quvvatlanadi)
 * Jadval ID: 1ITy_OER1O6YIjoopZUR31rBxj9v8bwsBfp1rUalJO3A
 * 
 * Ushbu kodni Google Jadval -> Kengaytmalar (Extensions) -> Apps Script bo'limiga qo'ying
 * va "Deploy" -> "New deployment" -> "Web App" (Execute as: Me, Who has access: Anyone) qilib e'lon qiling.
 */

const SHEET_ID = '1ITy_OER1O6YIjoopZUR31rBxj9v8bwsBfp1rUalJO3A';
const SHEET_NAME = 'Лишний_Товар';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID) || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    const firstSheet = ss.getSheets()[0];
    if (firstSheet && firstSheet.getLastRow() === 0) {
      sheet = firstSheet;
      sheet.setName(SHEET_NAME);
    } else {
      sheet = ss.insertSheet(SHEET_NAME);
    }
  }

  // Headerlarni tekshirish va yaratish
  if (sheet.getLastRow() === 0) {
    const headers = [
      '№',
      'Дата и Время',
      'Смена',
      'Сотрудник (Оператор)',
      'Номер Стола',
      'Номер Короба (Исходный)',
      'Куда переложен (Новый короб)',
      'ПВЗ',
      'Штрих-код Товара',
      'Количество',
      'Примечание'
    ];
    
    sheet.appendRow(headers);
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0f172a');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);

    // Ustunlar kengligini moslash
    sheet.setColumnWidth(1, 50);  // №
    sheet.setColumnWidth(2, 160); // Дата и Время
    sheet.setColumnWidth(3, 150); // Смена
    sheet.setColumnWidth(4, 160); // Сотрудник
    sheet.setColumnWidth(5, 130); // Номер Стола
    sheet.setColumnWidth(6, 150); // Номер Короба (Исходный)
    sheet.setColumnWidth(7, 170); // Куда переложен (Новый короб)
    sheet.setColumnWidth(8, 170); // ПВЗ
    sheet.setColumnWidth(9, 200); // Штрих-код Товара
    sheet.setColumnWidth(10, 100); // Количество
    sheet.setColumnWidth(11, 160); // Примечание
  }
  
  return sheet;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // 50 kishi bir vaqtda korup yopganda navbat kutishi uchun 30 soniya kutish
    lock.waitLock(30000);
  } catch (ex) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Server band, iltimos qayta urinib ko\'ring'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const sheet = getOrCreateSheet();
    let postData;
    
    try {
      postData = JSON.parse(e.postData.contents);
    } catch (parseError) {
      postData = e.parameter || {};
    }

    const action = postData.action || 'append_items';

    if (action === 'append_items' || Array.isArray(postData.items)) {
      const items = Array.isArray(postData.items) ? postData.items : [postData];
      let startRow = sheet.getLastRow();
      
      const rowsToAdd = [];
      const now = new Date();
      const formattedDate = Utilities.formatDate(now, "Asia/Tashkent", "yyyy-MM-dd HH:mm:ss");

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rowNum = startRow + i;
        const targetBoxValue = item.targetBox && item.targetBox !== '—' ? item.targetBox : (item.status || '—');
        const reasonValue = item.reason || item.note || 'Лишний товар в коробе';
        const pvzValue = item.pvz && item.pvz !== '—' ? item.pvz : '—';
        const shiftText = item.shift ? String(item.shift).replace('Smena ', '') : 'Смена 1';

        // Aniq foydalanuvchi jadvali tartibi bo'yicha:
        rowsToAdd.push([
          rowNum,                                     // 1. №
          item.timestamp || formattedDate,            // 2. Дата
          shiftText,                                  // 3. Смена
          item.operator || 'Неизвестно',              // 4. Сотрудник
          item.tableNumber || '—',                    // 5. Номер Стола
          item.boxNumber || '',                       // 6. Номер коруба
          "'" + (item.barcode || ''),                 // 7. Шк товар
          item.count || 1,                            // 8. Кол
          targetBoxValue,                             // 9. новый коруба
          pvzValue,                                   // 10. ПВЗ
          reasonValue                                 // 11. Причина
        ]);
      }

      if (rowsToAdd.length > 0) {
        const range = sheet.getRange(startRow + 1, 1, rowsToAdd.length, rowsToAdd[0].length);
        range.setValues(rowsToAdd);
        range.setVerticalAlignment('middle');
        
        sheet.getRange(startRow + 1, 1, rowsToAdd.length, 1).setHorizontalAlignment('center');
        sheet.getRange(startRow + 1, 3, rowsToAdd.length, 1).setHorizontalAlignment('center');
        sheet.getRange(startRow + 1, 5, rowsToAdd.length, 1).setHorizontalAlignment('center'); // Номер Стола
        sheet.getRange(startRow + 1, 6, rowsToAdd.length, 2).setHorizontalAlignment('center'); // Исходный + Новый короб
        sheet.getRange(startRow + 1, 8, rowsToAdd.length, 1).setHorizontalAlignment('center');
        sheet.getRange(startRow + 1, 10, rowsToAdd.length, 1).setHorizontalAlignment('center');
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: rowsToAdd.length + ' ta tovar muvaffaqiyatli jadvalga yozildi',
        count: rowsToAdd.length,
        timestamp: formattedDate
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'update_status') {
      const barcode = postData.barcode;
      const boxNumber = postData.boxNumber;
      const newStatus = postData.status;

      const data = sheet.getDataRange().getValues();
      let updated = 0;

      for (let r = 1; r < data.length; r++) {
        const rowBox = String(data[r][4]);
        const rowBarcode = String(data[r][6]).replace(/'/g, '');

        if ((boxNumber && rowBox === String(boxNumber)) || (barcode && rowBarcode === String(barcode))) {
          sheet.getRange(r + 1, 9).setValue(newStatus);
          updated++;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        updatedRows: updated,
        status: newStatus
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Amal bajarildi'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'online',
      sheetId: SHEET_ID
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
