import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Upload, 
  FileAudio, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Play,
  MessageSquare,
  FileText,
  BarChart3,
  Download,
  Share,
  Save,
  RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  analysisCount: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'completed' | 'processing' | 'failed' | 'queued';
  metadata?: Record<string, any>;
}

interface AnalysisCreationProps {
  department: Department;
  onBack: () => void;
}

type Step = 'upload' | 'transcription' | 'analysis' | 'results' | 'automation';

const AnalysisCreation = ({ department, onBack }: AnalysisCreationProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [analysisName, setAnalysisName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [customFields, setCustomFields] = useState<Array<{name: string, value: string}>>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{question: string, answer: string}>>([]);

  const mockFiles: UploadedFile[] = [
    { id: '1', name: 'call_001.mp3', size: 2500000, status: 'completed' },
    { id: '2', name: 'call_002.wav', size: 3200000, status: 'processing' },
    { id: '3', name: 'call_003.mp3', size: 1800000, status: 'queued' },
  ];

  const predefinedQuestions = [
    'What are the most common objections raised by customers?',
    'Which opening phrases lead to the highest engagement?',
    'How often do agents successfully handle pricing questions?',
    'What sentiment patterns emerge throughout successful calls?',
    'Which closing techniques are most effective?'
  ];

  const getFileStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Play className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'queued':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Queued</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="analysisName">Analysis Name</Label>
                  <Input
                    id="analysisName"
                    value={analysisName}
                    onChange={(e) => setAnalysisName(e.target.value)}
                    placeholder="e.g., Weekly Quality Review - Week 45"
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={department.name} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add custom metadata fields for your uploaded files
                </p>
                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Field name"
                      value={field.name}
                      onChange={(e) => {
                        const newFields = [...customFields];
                        newFields[index].name = e.target.value;
                        setCustomFields(newFields);
                      }}
                    />
                    <Input
                      placeholder="Default value"
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...customFields];
                        newFields[index].value = e.target.value;
                        setCustomFields(newFields);
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setCustomFields([...customFields, { name: '', value: '' }])}
                >
                  Add Field
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload Audio Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Drop your audio files here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports MP3, WAV, M4A files up to 100MB each
                  </p>
                  <Button>Choose Files</Button>
                </div>

                {mockFiles.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium">Uploaded Files ({mockFiles.length})</h4>
                    {mockFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileAudio className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                        {getFileStatusBadge(file.status)}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={() => setCurrentStep('transcription')}
                    disabled={mockFiles.length === 0}
                  >
                    Start Transcription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'transcription':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transcription Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Overall Progress</span>
                    <span>{transcriptionProgress}%</span>
                  </div>
                  <Progress value={transcriptionProgress} className="w-full" />
                </div>

                <div className="space-y-3">
                  {mockFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileAudio className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.status === 'completed' ? 'Transcription complete' : 
                             file.status === 'processing' ? 'Transcribing...' : 
                             'In queue'}
                          </p>
                        </div>
                      </div>
                      {getFileStatusBadge(file.status)}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep('analysis')}>
                    Continue to Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Chat-style Questions</TabsTrigger>
                <TabsTrigger value="predefined">Pre-defined Questions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ask Questions About Your Calls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-muted/20">
                      {chatHistory.length === 0 ? (
                        <p className="text-muted-foreground text-center mt-20">
                          Ask a question to get started with your analysis
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {chatHistory.map((item, index) => (
                            <div key={index} className="space-y-2">
                              <div className="bg-blue-100 rounded-lg p-3 ml-auto max-w-[80%]">
                                <p className="font-medium">You:</p>
                                <p>{item.question}</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 mr-auto max-w-[80%]">
                                <p className="font-medium">Analysis:</p>
                                <p>{item.answer}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        placeholder="Ask a question about your calls..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && currentQuestion.trim()) {
                            setChatHistory([...chatHistory, {
                              question: currentQuestion,
                              answer: "Based on the analysis of your calls, here's what I found..."
                            }]);
                            setCurrentQuestion('');
                          }
                        }}
                      />
                      <Button 
                        onClick={() => {
                          if (currentQuestion.trim()) {
                            setChatHistory([...chatHistory, {
                              question: currentQuestion,
                              answer: "Based on the analysis of your calls, here's what I found..."
                            }]);
                            setCurrentQuestion('');
                          }
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="predefined" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pre-defined Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      {predefinedQuestions.map((question, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <p className="flex-1">{question}</p>
                          <Button variant="outline" size="sm">
                            Analyze
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('transcription')}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep('results')}>
                View Results
              </Button>
            </div>
          </div>
        );

      case 'results':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-medium mb-2">Key Findings:</h3>
                  <p className="text-sm mb-4">
                    Based on the analysis of 127 customer service calls, agents who used empathetic 
                    language in the first 30 seconds achieved 23% higher customer satisfaction scores.
                  </p>
                  
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium mb-2">Success Metrics</h4>
                    <div className="h-48 bg-muted/10 rounded flex items-center justify-center">
                      <BarChart3 className="w-16 h-16 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Chart visualization would appear here</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button variant="outline">
                      <Share className="w-4 h-4 mr-2" />
                      Share Link
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Save & Exit
                    </Button>
                    <Button onClick={() => setCurrentStep('automation')}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Save as Repeat Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('analysis')}>
                Back
              </Button>
            </div>
          </div>
        );

      case 'automation':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Automation Name</Label>
                  <Input value={`${analysisName} - Automated`} />
                </div>
                
                <div>
                  <Label>Data Source</Label>
                  <Input placeholder="Select software to pull audio files from" />
                </div>
                
                <div>
                  <Label>Recipients</Label>
                  <Textarea placeholder="Enter email addresses of users and admins to send results to" />
                </div>
                
                <div>
                  <Label>Frequency</Label>
                  <Input placeholder="e.g., Weekly, Monthly, Daily" />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep('results')}>
                    Back
                  </Button>
                  <Button>
                    Create Automation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'upload': return 'Step 1: Upload Files';
      case 'transcription': return 'Step 2: Transcription';
      case 'analysis': return 'Step 3: Analysis';
      case 'results': return 'Step 4: Results';
      case 'automation': return 'Step 5: Automation';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {department.name}
        </Button>
      </div>

      <div>
        <h1 className="heading-display text-foreground">{getStepTitle()}</h1>
        <p className="text-muted-foreground">Create a new analysis for {department.name}</p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {['upload', 'transcription', 'analysis', 'results', 'automation'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === step ? 'bg-primary text-primary-foreground' :
              ['upload', 'transcription', 'analysis', 'results', 'automation'].indexOf(currentStep) > index ? 'bg-green-500 text-white' :
              'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>
            {index < 4 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
};

export default AnalysisCreation;