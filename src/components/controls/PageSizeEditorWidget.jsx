import React from 'react';
import MagneticWidget from './MagneticWidget';
import PageSizeEditor from './PageSizeEditor';

const PageSizeEditorWidget = ({ widgetId }) => {
  return (
    <MagneticWidget widgetId={widgetId}>
      <PageSizeEditor />
    </MagneticWidget>
  );
};

export default PageSizeEditorWidget;
