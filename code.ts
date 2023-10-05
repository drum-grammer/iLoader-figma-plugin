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
  // 폰트 로드
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });

  const PADDING = 20;
  let yOffset = 0;
  let maxBoxWidth = getMaxBoxWidth(data);

  for (const extract of data.extracts) {
    const { questionBox, questionNode } = createQuestion(extract, yOffset);
    const answerNodes = createAnswers(extract, yOffset + questionBox.height + 10);

    // wrappingBox 생성
    const wrappingBox = createWrappingBox(questionBox, answerNodes, maxBoxWidth, PADDING);

    // 노드들 추가
    figma.currentPage.appendChild(wrappingBox);
    figma.currentPage.appendChild(questionBox);
    figma.currentPage.appendChild(questionNode);
    for (const node of answerNodes) {
      figma.currentPage.appendChild(node);
    }

    const group = figma.group([wrappingBox, questionBox, questionNode, ...answerNodes], figma.currentPage);
    group.name = extract.question_content;

    yOffset += group.height + 20; // 그룹의 높이를 기반으로 yOffset 갱신
  }

  figma.closePlugin();
}

function getMaxBoxWidth(data: QuestionnaireData): number {
  let maxWidth = 0;
  for (const extract of data.extracts) {
    const textNode = figma.createText();
    textNode.characters = extract.question_content;
    if (textNode.width > maxWidth) {
      maxWidth = textNode.width;
    }
    for (const answer of extract.answers) {
      textNode.characters = answer;
      if (textNode.width > maxWidth) {
        maxWidth = textNode.width;
      }
    }
  }
  return maxWidth + 20;
}

function createQuestion(extract: AnswerData, yOffset: number) {
  const questionNode = figma.createText();
  questionNode.characters = extract.question_content;

  const questionBox = figma.createRectangle();
  questionBox.resize(questionNode.width + 20, questionNode.height + 10);
  questionBox.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.6, b: 0.8 } }];
  questionBox.y = yOffset;

  questionNode.y = yOffset + 5;

  figma.currentPage.appendChild(questionBox);
  figma.currentPage.appendChild(questionNode);

  return { questionBox, questionNode };
}

function createAnswers(extract: AnswerData, yOffset: number) {
  const answerNodes = [];
  for (const answer of extract.answers) {
    const answerNode = figma.createText();
    answerNode.characters = answer;
    answerNode.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    answerNode.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.3 },
      offset: { x: 2, y: 2 },
      radius: 2,
      spread: 0,
      visible: true,
      blendMode: "NORMAL"
    }];
    answerNode.y = yOffset;

    figma.currentPage.appendChild(answerNode);
    answerNodes.push(answerNode);

    yOffset += answerNode.height + 5;
  }
  return answerNodes;
}

/**
 * 질문과 답변을 감싸는 회색 박스를 생성합니다.
 *
 * @param questionBox - 질문 텍스트를 포함하는 박스
 * @param answerNodes - 답변 텍스트 노드들
 * @param maxBoxWidth - 가장 넓은 박스의 너비
 * @param PADDING - 박스 주변의 패딩 값
 * @returns 생성된 회색 박스
 */
function createWrappingBox(
    questionBox: RectangleNode,
    answerNodes: TextNode[],
    maxBoxWidth: number,
    PADDING: number
): RectangleNode {
  const totalHeight = answerNodes.reduce((sum, node) => sum + node.height, questionBox.height) + (4 + answerNodes.length / 2) * PADDING;
  const wrappingBox = figma.createRectangle();
  wrappingBox.resize(maxBoxWidth + 2 * PADDING, totalHeight);
  wrappingBox.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
  wrappingBox.x = questionBox.x - PADDING; // 박스의 x 좌표를 조정
  wrappingBox.y = questionBox.y - PADDING;
  return wrappingBox;
}
