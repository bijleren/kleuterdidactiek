interface Word {
  word: string;
  goals: string[];
  isCustom?: boolean;
}

interface VocabularyCategory {
  id: string;
  title: string;
  icon: string;
  categoryType: string;
  goalCodes: string;
  description: string;
  colorCode: string;
  words: Word[];
}

export const exportVocabularyToPDF = (
  categories: VocabularyCategory[],
  groupName: string,
  clickCounts: { [word: string]: number } = {},
  /** Gekozen leeftijd/net, bv. "4-5 jaar • Katholiek"; leeg = geen filter. */
  filterLabel = ''
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Blokkeer popup-blocker om PDF te exporteren');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Woordenschat - ${groupName}${filterLabel ? ` - ${filterLabel}` : ''}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #333;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #6B46C1;
    }

    .header h1 {
      font-size: 24pt;
      color: #6B46C1;
      margin-bottom: 8px;
    }

    .header p {
      font-size: 11pt;
      color: #666;
    }

    .category {
      page-break-inside: avoid;
      margin-bottom: 20px;
      border: 2px solid #ddd;
      border-radius: 12px;
      padding: 15px;
      background: #fff;
    }

    .category-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 3px solid;
    }

    .category-icon {
      font-size: 20pt;
      margin-right: 10px;
    }

    .category-title {
      font-size: 14pt;
      font-weight: bold;
      color: #333;
      flex: 1;
    }

    .category-info {
      font-size: 8pt;
      color: #666;
      margin-bottom: 10px;
      font-style: italic;
    }

    .words-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
    }

    .word-card {
      position: relative;
      padding: 8px 12px;
      border: 2px solid;
      border-radius: 8px;
      font-size: 9pt;
      font-weight: 500;
      text-align: center;
      background: #f9f9f9;
    }

    .word-card.custom {
      background: #E0F2FE;
      border-color: #0EA5E9;
    }

    .word-card.standard {
      background: #F3F4F6;
      border-color: #9CA3AF;
    }

    .word-count {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #F87171;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7pt;
      font-weight: bold;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #ddd;
      text-align: center;
      font-size: 8pt;
      color: #888;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .category {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 Woordenschat</h1>
    <p>${groupName}${filterLabel ? ` • ${filterLabel}` : ''} • ${new Date().toLocaleDateString('nl-BE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</p>
  </div>

  ${categories
    .map(
      (cat) => `
    <div class="category">
      <div class="category-header" style="border-color: ${cat.colorCode || '#9CA3AF'}">
        <span class="category-icon">${cat.icon}</span>
        <span class="category-title">${cat.title}</span>
      </div>
      <div class="category-info">${cat.goalCodes} - ${cat.description}</div>
      <div class="words-grid">
        ${cat.words
          .map((word) => {
            const count = clickCounts[word.word] || 0;
            return `
          <div class="word-card ${word.isCustom ? 'custom' : 'standard'}" style="border-color: ${cat.colorCode || '#9CA3AF'}">
            ${count > 0 ? `<span class="word-count">${count}</span>` : ''}
            ${word.word}
          </div>
        `;
          })
          .join('')}
      </div>
    </div>
  `
    )
    .join('')}

  <div class="footer">
    <p>Officiële Kleuteronderwijs Woordenschat - Nieuwe minimumdoelen voor het kleuteronderwijs</p>
    <p>Gegenereerd op ${new Date().toLocaleString('nl-BE')}</p>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

