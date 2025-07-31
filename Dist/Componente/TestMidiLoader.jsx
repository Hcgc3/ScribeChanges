import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Music } from 'lucide-react';

const TestMidiLoader = ({ onMidiLoad }) => {
  const loadSampleMidi = async () => {
    try {
      const response = await fetch('/sample.mid');
      const arrayBuffer = await response.arrayBuffer();
      
      // Create a File object to simulate file upload
      const file = new File([arrayBuffer], 'sample.mid', { type: 'audio/midi' });
      
      // Trigger the upload handler
      onMidiLoad(file);
    } catch (error) {
      console.error('Error loading sample MIDI:', error);
      alert('Error loading sample MIDI file');
    }
  };

  return (
    <div className="mt-4 text-center">
      <p className="text-slate-400 text-sm mb-3">
        Don't have a MIDI file? Try our sample:
      </p>
      <Button
        variant="outline"
        onClick={loadSampleMidi}
        className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
      >
        <Music className="w-4 h-4 mr-2" />
        Load Sample MIDI
      </Button>
    </div>
  );
};

export default TestMidiLoader;

