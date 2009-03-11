<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:ns1="http://bpms.intalio.com/bpms/basic-types"
    xmlns:tns="http://www.example.com/dbtest"
    xmlns:p="http://www.example.org/PeopleLookup"
    xmlns:rbac="http://tempo.intalio.org/security/RBACQueryService/">
	<xsl:template match="/">
		 <xsl:element name="person">
	    	<xsl:element name="lastname" namespace="http://www.example.org/PeopleLookup">
	    		 <xsl:value-of select="//rbac:property[rbac:name='sn']/rbac:value"/>
	    	</xsl:element>
	    	<xsl:element name="firstname" namespace="http://www.example.org/PeopleLookup">
	    		<xsl:value-of select="//rbac:property[rbac:name='givenname']/rbac:value"/>
	    	</xsl:element>
	    	<xsl:element name="email" namespace="http://www.example.org/PeopleLookup">
	    		<xsl:value-of select="//rbac:property[rbac:name='email']/rbac:value"/>
	    	</xsl:element>
	    	<xsl:element name="userID" namespace="http://www.example.org/PeopleLookup">
	    		<xsl:value-of select="//rbac:property[rbac:name='cn']/rbac:value"/>
	    	</xsl:element>
	    	
	    	<xsl:element name="location" namespace="http://www.example.org/PeopleLookup">
	    		<xsl:value-of select="//rbac:property[rbac:name='streetaddress']/rbac:value"/>
	    	</xsl:element>
	    </xsl:element>
	</xsl:template>
</xsl:stylesheet>