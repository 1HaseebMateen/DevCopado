public with sharing class noteTaskLWC {
    @AuraEnabled
    public static Note__c insertNote(Note__c record){
        System.debug('hello '+record);
        try {
            insert record;
            return record;
        } 
        catch (Exception exp) {
            throw new AuraHandledException(exp.getMessage());
        }
        }
        @AuraEnabled(Cacheable=true)
        public static List<Note__c> getNote(Id recordId){
            system.debug('hello '+recordId);
            List<Note__c> noteList = [Select Id, Subject__c,Description__c,opportunity__c ,opportunity__r.Name,Pin__c from Note__c where opportunity__c = : recordId OR opportunity__c = null Order By Pin__c DESC];
            system.debug('note '+noteList);
            return noteList;
        
        }
        @AuraEnabled(cacheable=false)
        public static List<Note__c> getNoteToUpdate(id recordId){
            List<Note__c> noteList = [Select Id, Subject__c,Description__c,opportunity__c ,opportunity__r.Name,Pin__c from Note__c where Id = : recordId];
            return noteList;
        
        }
        @AuraEnabled(cacheable=false)
    public static  List<Note__c> updateNote(Id recordId,Note__c record){
        system.debug('note to update'+record);
        List<Note__c> noteList = [Select Id, Subject__c, Description__c,opportunity__c,Pin__c,opportunity__r.Name from Note__c where Id = : recordId];
        List<Note__c> noteListUpdate = new List<Note__c>(); 
        system.debug('noteList '+noteList);
        try {
            for(Note__c note : noteList){
                Note__c noteObj = new Note__c();
                noteObj.Id = recordId;
                noteObj.Subject__c = record.Subject__c;
                noteObj.Description__c = record.Description__c;
                noteObj.opportunity__c =  record.opportunity__c;
                system.debug('Note '+ noteObj);
                noteListUpdate.add(noteObj);
            }
            system.debug('Note list update' + noteListUpdate);
            update noteListUpdate;
            return noteListUpdate;
        } 
        catch (Exception exp) {
            throw new AuraHandledException(exp.getMessage());
        }
        }
        @AuraEnabled
        public static  List<Note__c> pinNote(Id recordId){
            List<Note__c> noteList = [Select Id, Subject__c, Description__c,opportunity__c,opportunity__r.Name,Pin__c from Note__c where Id = : recordId];
            List<Note__c> noteListUpdate = new List<Note__c>(); 
            try {
                for(Note__c note : noteList){
                    Note__c noteObj = new Note__c();
                if(note.Pin__c == true){
                    noteObj.Pin__c = false;
                    }
                    else if(note.Pin__c == false){
                    noteObj.Pin__c =true;
                    }
                    noteObj.Id = recordId;
                    noteListUpdate.add(noteObj);
                }
                update noteListUpdate;
                return noteListUpdate;
            } 
            catch (Exception exp) {
                throw new AuraHandledException(exp.getMessage());
            }
            }
            @AuraEnabled(cacheable=false)
            public static List<Note__c> getPinned(Id recordId){
                List<Note__c> noteList = [Select Id, Subject__c,Description__c,opportunity__c ,opportunity__r.Name,Pin__c from Note__c where (opportunity__c = : recordId OR opportunity__c = null) AND Pin__c = true];
                return noteList;
            
            }
    }