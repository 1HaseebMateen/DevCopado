@IsTest
public class NoteTaskLWCTest {
    @TestSetup
    static void setupTestData() {
        // Create a dummy opportunity
        Opportunity opp = new Opportunity(Name = 'Test Opportunity', CloseDate = Date.today(), StageName = 'Prospecting');
        insert opp;

        // Create a dummy note with and without Pin__c flag for the opportunity
        Note__c note1 = new Note__c(Subject__c = 'Test Subject 1', Description__c = 'Test Description 1', Opportunity__c = opp.Id, Pin__c = false);
        Note__c note2 = new Note__c(Subject__c = 'Test Subject 2', Description__c = 'Test Description 2', Opportunity__c = opp.Id, Pin__c = true);
        Note__c note3 = new Note__c(Subject__c = 'Test Subject 3', Description__c = 'Test Description 3', Pin__c = false);
        insert new List<Note__c>{note1, note2, note3};
    }

    @IsTest
    static void testInsertNote() {
        // Create a new note to insert
        Note__c note = new Note__c(Subject__c = 'Inserted Note', Description__c = 'This is a test', Opportunity__c = [SELECT Id FROM Opportunity LIMIT 1].Id);
        
        Test.startTest();
        Note__c insertedNote = noteTaskLWC.insertNote(note);
        Test.stopTest();

        // Verify that the note is inserted
        System.assertNotEquals(null, insertedNote.Id, 'Note should have been inserted successfully.');
        System.assertEquals('Inserted Note', insertedNote.Subject__c, 'Note subject should match the inserted value.');
    }

    @IsTest
    static void testGetNote() {
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];

        Test.startTest();
        List<Note__c> notes = noteTaskLWC.getNote(opp.Id);
        Test.stopTest();

        // Assert that notes are returned for the opportunity
        System.assert(notes.size() > 0, 'Notes should be retrieved.');
    }

    @IsTest
    static void testGetNoteToUpdate() {
        Note__c note = [SELECT Id FROM Note__c LIMIT 1];

        Test.startTest();
        List<Note__c> notes = noteTaskLWC.getNoteToUpdate(note.Id);
        Test.stopTest();

        // Assert that the note to update is retrieved
        System.assert(notes.size() == 1, 'One note should be retrieved.');
    }

    @IsTest
    static void testUpdateNote() {
        Note__c note = [SELECT Id FROM Note__c LIMIT 1];

        // Prepare the updated values
        Note__c updatedNote = new Note__c(Subject__c = 'Updated Subject', Description__c = 'Updated Description', Opportunity__c = [SELECT Id FROM Opportunity LIMIT 1].Id);

        Test.startTest();
        List<Note__c> updatedNotes = noteTaskLWC.updateNote(note.Id, updatedNote);
        Test.stopTest();

        // Assert the note was updated
        System.assertEquals(1, updatedNotes.size(), 'One note should be updated.');
        System.assertEquals('Updated Subject', updatedNotes[0].Subject__c, 'Note subject should be updated.');
    }

    @IsTest
    static void testPinNote() {
        Note__c note = [SELECT Id, Pin__c FROM Note__c WHERE Pin__c = false LIMIT 1];

        Test.startTest();
        List<Note__c> pinnedNotes = noteTaskLWC.pinNote(note.Id);
        Test.stopTest();

        // Assert that the note was pinned
        System.assertEquals(true, pinnedNotes[0].Pin__c, 'The note should be pinned.');
    }

    @IsTest
    static void testGetPinned() {
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];

        Test.startTest();
        List<Note__c> pinnedNotes = noteTaskLWC.getPinned(opp.Id);
        Test.stopTest();

        // Assert that pinned notes are retrieved
        System.assert(pinnedNotes.size() > 0, 'There should be pinned notes for the opportunity.');
    }
}