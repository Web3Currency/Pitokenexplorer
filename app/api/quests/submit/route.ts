import { NextRequest, NextResponse } from 'next/server';
import { addQuest, type Quest } from '@/lib/admin/questStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.data || !body.data.questTitle || !body.data.projectName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // TODO: Add payment verification here
    // For now, proceed with submission
    
    const newQuest: Quest = {
      id: `quest-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: body.data.questTitle,
      description: body.data.questDescription || '',
      projectName: body.data.projectName,
      projectLogo: body.data.projectLogo || '/placeholder-logo.png',
      bannerUrl: body.data.bannerUrl || '/placeholder.svg?height=200&width=600',
      rewardPool: body.data.rewardPool || '0π',
      status: 'pending', // All new submissions start as pending
      submittedAt: new Date().toISOString(),
      submittedBy: body.submittedBy || 'creator',
      data: body.data, // Store full quest data
    };
    
    await addQuest(newQuest);
    
    return NextResponse.json({ 
      success: true, 
      questId: newQuest.id,
      message: 'Quest submitted for review! You will be notified when it is approved.'
    });
  } catch (error) {
    console.error('[v0] Quest submission error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to submit quest' 
    }, { status: 500 });
  }
}
