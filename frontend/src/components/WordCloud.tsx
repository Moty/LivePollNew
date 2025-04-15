import React from 'react';
import ReactWordcloud from 'react-wordcloud';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

interface Word {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: Word[];
  height?: string | number;
  width?: string | number;
}

const WordCloud: React.FC<WordCloudProps> = ({ 
  words, 
  height = 400,
  width = '100%'
}) => {
  const options = {
    rotations: 2,
    rotationAngles: [-90, 0] as [number, number],
    fontSizes: [12, 60] as [number, number],
    enableOptimizations: true,
    deterministic: true,
    fontFamily: 'Impact',
    padding: 3,
    colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
  };

  const callbacks = {
    onWordClick: console.log,
    onWordMouseOver: console.log,
    getWordTooltip: (word: Word) => `${word.text} (${word.value})`,
  };

  return (
    <div style={{ width, height }}>
      <ReactWordcloud
        words={words}
        options={options}
        callbacks={callbacks}
        size={[typeof width === 'number' ? width : 600, typeof height === 'number' ? height : 400]}
      />
      {/* Presenter counter for total words submitted */}
      <div style={{ marginTop: 16, textAlign: 'center', color: '#888', fontSize: 14 }}>
        {words.reduce((sum, w) => sum + (w.value || 0), 0)} words submitted by participants
      </div>
    </div>
  );
};

export default WordCloud;
