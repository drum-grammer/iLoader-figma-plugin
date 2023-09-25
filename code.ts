const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<body>
  <input type="text" id="documentKey" placeholder="Document Key" />
  <button onclick="sendDocumentKey()">Submit</button>

  <script>
    function sendDocumentKey() {
      const documentKey = document.getElementById('documentKey').value;
      window.parent.postMessage({ pluginMessage: { type: 'document-key', documentKey } }, '*');
    }
  </script>
</body>
</html>
`;

type AnswerData = {
  question_id: string;
  question_content: string;
  answers: string[];
};

type QuestionnaireData = {
  questionnaire_id: string;
  questionnaire_title: string;
  extracts: AnswerData[];
};

figma.showUI(htmlContent, { width: 240, height: 100 }); // UI를 보여주고 사용자로부터 Document Key를 입력 받습니다.

figma.ui.onmessage = (msg) => {
  if (msg.type === 'document-key') {
    const documentKey = msg.documentKey;
    const url = `https://api-i-loader.52g.studio/data-extracts/key/${documentKey}`; // Document Key를 사용하여 URL을 생성합니다.


    fetch(url)
        .then(response => response.json())
        .then((data: QuestionnaireData) => createTextNodesFromData(data))
        .catch(error => console.error('Error:', error));
  }
};

async function createTextNodesFromData(data: QuestionnaireData) {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  let yOffset = 0;

  for (const extract of data.extracts) {
    const questionNode = figma.createText();
    questionNode.characters = extract.question_content;

    // questionNode에 대한 큰 색깔 있는 박스 생성
    const questionBox = figma.createRectangle();
    questionBox.resize(questionNode.width + 20, questionNode.height + 10);
    questionBox.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.6, b: 0.8 } }];
    questionBox.y = yOffset;
    figma.currentPage.appendChild(questionBox);

    questionNode.y = yOffset + 5;
    questionNode.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    figma.currentPage.appendChild(questionNode);

    yOffset += questionBox.height + 10;

    const answerNodes = [];
    let totalAnswerHeight = 0;
    for (const answer of extract.answers) {
      const answerNode = figma.createText();
      answerNode.characters = answer;

      // answerNode에 대한 작은 박스 생성
      const answerBox = figma.createRectangle();
      answerBox.resize(answerNode.width + 15, answerNode.height + 5);
      answerBox.fills = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
      answerBox.y = yOffset;
      figma.currentPage.appendChild(answerBox);

      answerNode.y = yOffset + 2.5;
      figma.currentPage.appendChild(answerNode);

      yOffset += answerBox.height + 5;
      totalAnswerHeight += answerBox.height + 5;

      answerNodes.push(answerBox, answerNode);
    }

    // questionBox와 answerBox를 감싸는 박스 생성
    const wrappingBox = figma.createRectangle();
    wrappingBox.resize(questionBox.width, questionBox.height + totalAnswerHeight);
    wrappingBox.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    wrappingBox.y = questionBox.y;
    figma.currentPage.appendChild(wrappingBox);
    figma.currentPage.appendChild(questionBox);
    figma.currentPage.appendChild(questionNode);
    for (const node of answerNodes) {
      figma.currentPage.appendChild(node);
    }

    // 그룹핑
    const group = figma.group([wrappingBox, questionBox, questionNode, ...answerNodes], figma.currentPage);
    group.name = extract.question_content;

    yOffset += 20;
  }

  figma.closePlugin();
}
